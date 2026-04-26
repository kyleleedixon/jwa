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
  // Phase 2 — 4v4 vs benchmark
  teamWinRate: number;
  teamBeats: string[]; // benchmark team-keys this creature helped beat
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

// Top N candidates enter phase 2; benchmark opponents drawn from top M by 1v1
const PHASE2_CANDIDATES = 20;
const BENCHMARK_TOP     = 8;  // C(8,4) = 70 benchmark teams

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

  // ── Phase 2: candidate teams vs fixed benchmark opponents ─────────────────
  // Each of C(top-20, 4) = 4845 candidate teams fights each of C(top-8, 4) = 70
  // benchmark teams. Benchmarks represent the strongest meta opposition.
  // Total battles: ~340k — diverse enough that greedy coverage adds real value.
  const t2 = performance.now();
  const n  = Math.min(PHASE2_CANDIDATES, pool.length);
  const bn = Math.min(BENCHMARK_TOP, pool.length);

  const candidates       = scores.slice(0, n).map(s => s.creature);
  const benchmarkCreatures = scores.slice(0, bn).map(s => s.creature);

  const candidateTeams   = combos(candidates, Math.min(4, n));
  const benchmarkTeams   = combos(benchmarkCreatures, Math.min(4, bn));

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

  for (const candTeam of candidateTeams) {
    const ck = teamKey(candTeam);
    let teamWins = 0, teamBattles = 0;
    const beatenKeys: string[] = [];

    for (const benchTeam of benchmarkTeams) {
      const bk = teamKey(benchTeam);
      if (ck === bk) continue; // same team, skip
      const r = simulateTeamBattle(candTeam, benchTeam, config);
      if (r.winner !== 'draw') teamBattles++;
      if (r.winner === 'A') { teamWins++; beatenKeys.push(bk); }
    }

    for (const c of candTeam) {
      for (const bk of beatenKeys) creatureTeamBeats.get(c.uuid)!.add(bk);
      creatureTeamWins.set(c.uuid, (creatureTeamWins.get(c.uuid) ?? 0) + teamWins);
      creatureTeamBattles.set(c.uuid, (creatureTeamBattles.get(c.uuid) ?? 0) + teamBattles);
      creatureTeamsCount.set(c.uuid, (creatureTeamsCount.get(c.uuid) ?? 0) + 1);
    }
  }

  for (const s of scores) {
    const battles = creatureTeamBattles.get(s.creature.uuid) ?? 0;
    const wins    = creatureTeamWins.get(s.creature.uuid) ?? 0;
    s.teamWinRate = battles > 0 ? wins / battles : 0;
    s.teamBeats   = [...(creatureTeamBeats.get(s.creature.uuid) ?? [])];
    s.teamsCount  = creatureTeamsCount.get(s.creature.uuid) ?? 0;
  }

  scores.sort((a, b) => {
    const aP2 = a.teamsCount > 0, bP2 = b.teamsCount > 0;
    if (aP2 && bP2) return b.teamWinRate - a.teamWinRate || b.teamsCount - a.teamsCount;
    if (aP2) return -1;
    if (bP2) return 1;
    return b.winRate - a.winRate;
  });

  const phase2Ms = Math.round(performance.now() - t2);

  // ── Greedy team selection (coverage over benchmark team-key space) ─────────
  // All 20 candidates are in the same coverage space (benchmark team keys),
  // so greedy now finds genuine diversity: picks creature that beats benchmark
  // teams not already covered by the current roster.
  const phase2Scores = scores.filter(s => s.teamsCount > 0);
  const team: Creature[] = [];
  const covered = new Set<string>();
  const picked  = new Set<string>();

  while (team.length < 8 && team.length < phase2Scores.length) {
    let bestScore = -1, bestIdx = -1;

    for (let i = 0; i < phase2Scores.length; i++) {
      const s = phase2Scores[i];
      if (picked.has(s.creature.uuid)) continue;
      const newCov    = s.teamBeats.filter(k => !covered.has(k)).length;
      const slotScore = newCov * 1000 + Math.round(s.teamWinRate * 999);
      if (slotScore > bestScore) { bestScore = slotScore; bestIdx = i; }
    }

    if (bestIdx < 0) break;
    const chosen = phase2Scores[bestIdx];
    team.push(chosen.creature);
    picked.add(chosen.creature.uuid);
    chosen.teamBeats.forEach(k => covered.add(k));
  }

  // Fallback: fill from phase-1 if fewer than 8 phase-2 candidates
  if (team.length < 8) {
    for (const s of scores) {
      if (team.length >= 8) break;
      if (!picked.has(s.creature.uuid)) {
        team.push(s.creature);
        picked.add(s.creature.uuid);
      }
    }
  }

  return {
    scores, team, pool,
    phase1Ms, phase2Ms,
    durationMs: Math.round(performance.now() - t0),
    phase2Candidates: candidates.length,
    phase2Battles: candidateTeams.length * benchmarkTeams.length,
  };
}
