import { Creature } from '@/types/creature';
import { simulateBattle, simulateTeamBattle, BattleConfig } from './battle';

export interface TournamentRules {
  rarities: string[];
  level: number;
  boosts: boolean;
}

export interface CreatureScore {
  creature: Creature;
  // Phase 1 — 1v1
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  beats: string[];
  losesTo: string[];
  // Phase 2 — 4v4 team
  teamWinRate: number;
  teamBeats: string[]; // opponent team-keys this creature helped beat
  teamsCount: number;  // how many 4-creature combos this creature appeared in
}

export interface TournamentResult {
  scores: CreatureScore[];
  team: Creature[];
  pool: Creature[];
  phase1Ms: number;
  phase2Ms: number;
  durationMs: number;
  phase2Candidates: number;
  phase2Battles: number;
}

const PHASE2_CANDIDATES = 12;

function teamKey(team: Creature[]): string {
  return team.map(c => c.uuid).join(',');
}

function combos(arr: Creature[], size: number): Creature[][] {
  const result: Creature[][] = [];
  function go(start: number, cur: Creature[]) {
    if (cur.length === size) { result.push([...cur]); return; }
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i]);
      go(i + 1, cur);
      cur.pop();
    }
  }
  go(0, []);
  return result;
}

export function runTournamentOptimizer(
  allCreatures: Creature[],
  rules: TournamentRules,
): TournamentResult {
  const t0 = performance.now();
  const config: BattleConfig = { levelA: rules.level, levelB: rules.level };
  const pool = allCreatures.filter(c => rules.rarities.includes(c.rarity));

  // ── Phase 1: 1v1 all-vs-all ──────────────────────────────────────────────
  const beats   = new Map<string, Set<string>>();
  const losesTo = new Map<string, Set<string>>();
  const draws1  = new Map<string, Set<string>>();
  for (const c of pool) {
    beats.set(c.uuid, new Set());
    losesTo.set(c.uuid, new Set());
    draws1.set(c.uuid, new Set());
  }

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i], b = pool[j];
      const r = simulateBattle(a, b, config);
      if (r.winner === 'A') {
        beats.get(a.uuid)!.add(b.uuid);
        losesTo.get(b.uuid)!.add(a.uuid);
      } else if (r.winner === 'B') {
        beats.get(b.uuid)!.add(a.uuid);
        losesTo.get(a.uuid)!.add(b.uuid);
      } else {
        draws1.get(a.uuid)!.add(b.uuid);
        draws1.get(b.uuid)!.add(a.uuid);
      }
    }
  }

  const phase1Ms = Math.round(performance.now() - t0);

  const scores: CreatureScore[] = pool.map(c => {
    const w = beats.get(c.uuid)!.size;
    const l = losesTo.get(c.uuid)!.size;
    const d = draws1.get(c.uuid)!.size;
    const total = w + l + d;
    return {
      creature: c,
      wins: w, losses: l, draws: d,
      winRate: total > 0 ? w / total : 0,
      beats: [...beats.get(c.uuid)!],
      losesTo: [...losesTo.get(c.uuid)!],
      teamWinRate: 0, teamBeats: [], teamsCount: 0,
    };
  });

  scores.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

  // ── Phase 2: 4v4 all-vs-all among top candidates ─────────────────────────
  const t2 = performance.now();
  const n = Math.min(PHASE2_CANDIDATES, pool.length);
  const candidates = scores.slice(0, n).map(s => s.creature);
  const allTeams = combos(candidates, Math.min(4, candidates.length));

  const teamWinsMap   = new Map<string, Set<string>>();
  const teamLossesMap = new Map<string, Set<string>>();
  for (const t of allTeams) {
    teamWinsMap.set(teamKey(t), new Set());
    teamLossesMap.set(teamKey(t), new Set());
  }

  for (let i = 0; i < allTeams.length; i++) {
    for (let j = i + 1; j < allTeams.length; j++) {
      const tA = allTeams[i], tB = allTeams[j];
      const r = simulateTeamBattle(tA, tB, config);
      const kA = teamKey(tA), kB = teamKey(tB);
      if (r.winner === 'A') {
        teamWinsMap.get(kA)!.add(kB);
        teamLossesMap.get(kB)!.add(kA);
      } else if (r.winner === 'B') {
        teamWinsMap.get(kB)!.add(kA);
        teamLossesMap.get(kA)!.add(kB);
      }
    }
  }

  // Aggregate per-creature: team win counts and opponent teams beaten
  const creatureTeamBeats   = new Map<string, Set<string>>();
  const creatureTeamWins    = new Map<string, number>();
  const creatureTeamBattles = new Map<string, number>();
  const creatureTeamsCount  = new Map<string, number>();
  for (const c of candidates) {
    creatureTeamBeats.set(c.uuid, new Set());
    creatureTeamWins.set(c.uuid, 0);
    creatureTeamBattles.set(c.uuid, 0);
    creatureTeamsCount.set(c.uuid, 0);
  }

  for (const team of allTeams) {
    const tk = teamKey(team);
    const w = teamWinsMap.get(tk)!.size;
    const l = teamLossesMap.get(tk)!.size;
    for (const c of team) {
      for (const beaten of teamWinsMap.get(tk)!) creatureTeamBeats.get(c.uuid)!.add(beaten);
      creatureTeamWins.set(c.uuid, (creatureTeamWins.get(c.uuid) ?? 0) + w);
      creatureTeamBattles.set(c.uuid, (creatureTeamBattles.get(c.uuid) ?? 0) + w + l);
      creatureTeamsCount.set(c.uuid, (creatureTeamsCount.get(c.uuid) ?? 0) + 1);
    }
  }

  // Patch scores with phase 2 data
  for (const s of scores) {
    const battles = creatureTeamBattles.get(s.creature.uuid) ?? 0;
    const wins    = creatureTeamWins.get(s.creature.uuid) ?? 0;
    s.teamWinRate  = battles > 0 ? wins / battles : 0;
    s.teamBeats    = [...(creatureTeamBeats.get(s.creature.uuid) ?? [])];
    s.teamsCount   = creatureTeamsCount.get(s.creature.uuid) ?? 0;
  }

  // Re-sort: phase-2 creatures ranked by team win rate first, rest by 1v1
  scores.sort((a, b) => {
    const aP2 = a.teamsCount > 0;
    const bP2 = b.teamsCount > 0;
    if (aP2 && bP2) return b.teamWinRate - a.teamWinRate || b.teamsCount - a.teamsCount;
    if (aP2) return -1;
    if (bP2) return 1;
    return b.winRate - a.winRate;
  });

  const phase2Ms = Math.round(performance.now() - t2);

  // ── Greedy team selection (coverage-maximising) ───────────────────────────
  const team: Creature[] = [];
  const covered = new Set<string>();
  const picked  = new Set<string>();

  while (team.length < 8 && team.length < pool.length) {
    let bestScore = -1, bestIdx = -1;

    for (let i = 0; i < scores.length; i++) {
      const s = scores[i];
      if (picked.has(s.creature.uuid)) continue;
      const coverageSet = s.teamBeats.length > 0 ? s.teamBeats : s.beats;
      const newCov  = coverageSet.filter(k => !covered.has(k)).length;
      const rate    = s.teamBeats.length > 0 ? s.teamWinRate : s.winRate;
      const slotScore = newCov * 1000 + Math.round(rate * 999);
      if (slotScore > bestScore) { bestScore = slotScore; bestIdx = i; }
    }

    if (bestIdx < 0) break;
    const chosen = scores[bestIdx];
    team.push(chosen.creature);
    picked.add(chosen.creature.uuid);
    const cov = chosen.teamBeats.length > 0 ? chosen.teamBeats : chosen.beats;
    cov.forEach(k => covered.add(k));
  }

  return {
    scores, team, pool,
    phase1Ms, phase2Ms,
    durationMs: Math.round(performance.now() - t0),
    phase2Candidates: candidates.length,
    phase2Battles: allTeams.length * (allTeams.length - 1) / 2,
  };
}
