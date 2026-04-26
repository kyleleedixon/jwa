import { Creature, Move } from '@/types/creature';

// From CreatureModal — index = level-1, value/1e9 = multiplier relative to level 26
const LEVEL_MULT = [0x1199eba6,0x127bc022,0x1368430d,0x145f7443,0x15646119,0x16770992,0x1795e71c,0x18c406d8,0x1a0168ea,0x1b4e0d2d,0x1cab7a30,0x1e1b36cf,0x1f9bbc53,0x21301803,0x22d9d0b8,0x24975eb3,0x266bd0b6,0x28572603,0x2a5c6bdc,0x2c7a1bdb,0x2eb342d0,0x310967be,0x337c8aa4,0x360fb8a1,0x38c4786a,1e9,105e7,11025e5,0x44ff9315,0x48730efe,127e7,132e7,137e7,1425e6,15e8];

// Resistance key order matches creature.resistance array
const RESISTANCE_KEYS = ['rst_crit_decrease','rst_dot','rst_damage_decrease','rst_rend','rst_speed_decrease','rst_stun','rst_swap_prevent','rst_taunt','rst_vulner','rst_armor_decrease','rst_resistance_decrease_all','rst_heal_decrease','rst_daze'];
// Map action → resistance index
const RESISTANCE_FOR_ACTION: Record<string, number> = {
  dot: 1, damage_decrease: 2, rend: 3, speed_decrease: 4, stun: 5,
  swap_prevent: 6, taunt: 7, vulner: 8, armor_decrease: 9, crit_decrease: 0,
};

export function statAtLevel(base: number, level: number): number {
  return Math.floor(base * LEVEL_MULT[level - 1] / 1e9);
}

export interface BattleBoosts { health: number; damage: number; speed: number; }

export interface BattleConfig {
  levelA: number;
  levelB: number;
  boostsA?: BattleBoosts;
  boostsB?: BattleBoosts;
}

interface ActiveEffect {
  action: string;
  multiplier: number;
  hitsLeft: number;  // -1 = unlimited; for shields/dodge consumed per hit
  turnsLeft: number; // -1 = permanent (rare)
}

interface Fighter {
  id: 'A' | 'B';
  creature: Creature;
  hp: number;
  maxHp: number;
  baseDamage: number;
  baseSpeed: number;
  armor: number;
  crit: number;
  critm: number;
  effects: ActiveEffect[];
  cooldowns: Record<string, number>;
  delayLeft: Record<string, number>;
  stunTurns: number;
  memberHp: number[];   // per-member HP; length 1 for non-flock
  memberMaxHp: number;  // max HP per member
}

export interface BattleLogEntry {
  turn: number;
  actor: 'A' | 'B' | 'system';
  moveName: string;
  events: string[];
  hpA: number;
  hpB: number;
}

export interface BattleResult {
  winner: 'A' | 'B' | 'draw';
  turns: number;
  hpA: number;
  hpB: number;
  maxHpA: number;
  maxHpB: number;
  log: BattleLogEntry[];
}

// ─── Fighter initialisation ───────────────────────────────────────────────────

function initFighter(id: 'A' | 'B', creature: Creature, level: number, boosts: BattleBoosts = { health: 0, damage: 0, speed: 0 }): Fighter {
  const hp  = Math.round(statAtLevel(creature.health, level) * (1 + 0.025 * boosts.health));
  const dmg = Math.round(statAtLevel(creature.damage, level) * (1 + 0.025 * boosts.damage));
  const spd = statAtLevel(creature.speed, level) + boosts.speed * 2;

  const flockCount = creature.flock ?? 1;
  const memberMaxHp = flockCount > 1 ? Math.floor(hp / flockCount) : hp;
  const memberHp = Array.from({ length: flockCount }, () => memberMaxHp);
  const totalHp = memberHp.reduce((s, v) => s + v, 0);

  const delayLeft: Record<string, number> = {};
  creature.moves.filter(m => m.type === 'regular' && m.delay > 0)
    .forEach(m => { delayLeft[m.uuid] = m.delay; });

  return { id, creature, hp: totalHp, maxHp: totalHp, baseDamage: dmg, baseSpeed: spd, armor: creature.armor, crit: creature.crit, critm: creature.critm, effects: [], cooldowns: {}, delayLeft, stunTurns: 0, memberHp, memberMaxHp };
}

// ─── Effect helpers ───────────────────────────────────────────────────────────

function getEffect(f: Fighter, action: string): ActiveEffect | undefined {
  return f.effects.find(e => e.action === action);
}

function hasEffect(f: Fighter, action: string): boolean {
  return f.effects.some(e => e.action === action);
}

function addEffect(f: Fighter, action: string, multiplier: number, duration: number[] | undefined) {
  // Remove existing effect of same type (refresh)
  f.effects = f.effects.filter(e => e.action !== action);

  let hitsLeft = -1;
  let turnsLeft = -1;

  if (duration) {
    if (duration.length === 1) {
      turnsLeft = duration[0];
    } else {
      hitsLeft  = duration[0] === 0 ? -1 : duration[0]; // 0 means unlimited hits
      turnsLeft = duration[1];
    }
  }

  f.effects.push({ action, multiplier, hitsLeft, turnsLeft });
}

function removeEffects(f: Fighter, action: string) {
  f.effects = f.effects.filter(e => e.action !== action);
}

function currentDamage(f: Fighter): number {
  let dmg = f.baseDamage;
  for (const e of f.effects) {
    if (e.action === 'damage_increase') dmg += f.baseDamage * e.multiplier;
    if (e.action === 'damage_decrease') dmg -= f.baseDamage * e.multiplier;
  }
  return Math.max(0, dmg);
}

function currentSpeed(f: Fighter): number {
  let spd = f.baseSpeed;
  for (const e of f.effects) {
    if (e.action === 'speed_increase') spd += f.baseSpeed * e.multiplier;
    if (e.action === 'speed_decrease') spd -= f.baseSpeed * e.multiplier;
  }
  return Math.max(0, spd);
}

// ─── Alert helpers ────────────────────────────────────────────────────────────

function inAlert(f: Fighter, move: Move): boolean {
  return !!move.if_alert && (f.hp / f.maxHp * 100) <= move.if_alert.threshold;
}

function moveEffects(f: Fighter, move: Move): Move['effects'] {
  return inAlert(f, move) ? move.if_alert!.effects : move.effects;
}

function movePriority(f: Fighter, move: Move): number {
  return inAlert(f, move) ? move.if_alert!.priority : move.priority;
}

function moveCooldown(f: Fighter, move: Move): number {
  return inAlert(f, move) ? move.if_alert!.cooldown : move.cooldown;
}

// ─── Flock helpers ────────────────────────────────────────────────────────────

function weakestAliveIdx(f: Fighter): number {
  let best = -1, bestHp = Infinity;
  for (let i = 0; i < f.memberHp.length; i++) {
    if (f.memberHp[i] > 0 && f.memberHp[i] < bestHp) { best = i; bestHp = f.memberHp[i]; }
  }
  return best >= 0 ? best : 0;
}

function syncHp(f: Fighter) {
  f.hp = f.memberHp.reduce((s, v) => s + v, 0);
}

// Group attack: damage chains through members sequentially with overflow
function applyGroupDamage(defender: Fighter, rawDmg: number): number {
  let remaining = rawDmg, applied = 0;
  for (let i = 0; i < defender.memberHp.length && remaining > 0; i++) {
    if (defender.memberHp[i] <= 0) continue;
    const taken = Math.min(defender.memberHp[i], remaining);
    defender.memberHp[i] -= taken;
    applied += taken;
    remaining -= taken;
  }
  syncHp(defender);
  return applied;
}

// Single-target attack: hits weakest alive member, capped at that member's HP
function applyMemberDamage(defender: Fighter, rawDmg: number): { applied: number; absorbed: boolean } {
  const idx = weakestAliveIdx(defender);
  const cap = defender.memberHp[idx];
  const applied = Math.min(rawDmg, cap);
  defender.memberHp[idx] -= applied;
  syncHp(defender);
  return { applied, absorbed: rawDmg > cap };
}

// ─── Available moves ─────────────────────────────────────────────────────────

function regularMoves(f: Fighter): Move[] {
  return f.creature.moves.filter(m => {
    if (m.type !== 'regular') return false;
    if ((f.cooldowns[m.uuid] ?? 0) > 0) return false;
    if ((f.delayLeft[m.uuid] ?? 0) > 0) return false;
    return true;
  });
}

function counterMoves(f: Fighter): Move[] {
  return f.creature.moves.filter(m => m.type === 'counter');
}


// ─── Resistance ───────────────────────────────────────────────────────────────

function resistFraction(defender: Fighter, action: string): number {
  const idx = RESISTANCE_FOR_ACTION[action];
  if (idx === undefined) return 0;
  return (defender.creature.resistance?.[idx] ?? 0) / 100;
}

// ─── Damage calculation ───────────────────────────────────────────────────────

function calcDamage(
  attacker: Fighter,
  defender: Fighter,
  multiplier: number,
  bypassArmor: boolean,
  bypassDodge: boolean,
  removedShield: boolean,
  consume: boolean = true,
): number {
  let dmg = currentDamage(attacker) * multiplier;

  // Vulnerability on defender
  if (hasEffect(defender, 'vulner')) {
    const ve = getEffect(defender, 'vulner')!;
    const resist = resistFraction(defender, 'vulner');
    dmg *= (1 + ve.multiplier * (1 - resist));
  }

  // Armor
  if (!bypassArmor) {
    let armor = defender.armor;
    for (const e of defender.effects) {
      if (e.action === 'armor_increase') armor *= (1 + e.multiplier);
      if (e.action === 'armor_decrease') armor *= (1 - e.multiplier);
    }
    armor = Math.max(0, Math.min(100, armor));
    dmg *= (1 - armor / 100);
  }

  // Shield (if not removed this move)
  if (!removedShield && hasEffect(defender, 'shield')) {
    const se = getEffect(defender, 'shield')!;
    dmg *= (1 - se.multiplier);
    if (consume && se.hitsLeft > 0) {
      se.hitsLeft -= 1;
      if (se.hitsLeft === 0) removeEffects(defender, 'shield');
    }
  }

  // Dodge / cloak — model as expected value
  if (!bypassDodge) {
    if (hasEffect(defender, 'dodge')) {
      const de = getEffect(defender, 'dodge')!;
      dmg *= (1 - de.multiplier);
      if (consume && de.hitsLeft > 0) {
        de.hitsLeft -= 1;
        if (de.hitsLeft === 0) removeEffects(defender, 'dodge');
      }
    }
    if (hasEffect(defender, 'cloak')) {
      dmg *= 0.5;
      const ce = getEffect(defender, 'cloak')!;
      if (consume && ce.hitsLeft > 0) {
        ce.hitsLeft -= 1;
        if (ce.hitsLeft === 0) removeEffects(defender, 'cloak');
      }
    }
  }

  // Crit (expected value) — critm is stored as percentage (e.g. 125 = 1.25×)
  // Apply crit_increase/decrease effects, then nullify if dazed
  let effectiveCrit = attacker.crit;
  for (const e of attacker.effects) {
    if (e.action === 'crit_increase') effectiveCrit = Math.min(100, effectiveCrit + e.multiplier * 100);
    if (e.action === 'crit_decrease') effectiveCrit = Math.max(0, effectiveCrit - e.multiplier * 100);
  }
  if (hasEffect(attacker, 'daze')) effectiveCrit = 0;
  dmg *= (1 + (effectiveCrit / 100) * (attacker.critm / 100 - 1));

  return Math.round(Math.max(0, dmg));
}

// ─── Greedy move scorer ───────────────────────────────────────────────────────

function scoreMoveForDamage(move: Move, attacker: Fighter, defender: Fighter): number {
  let score = 0;
  const effs = moveEffects(attacker, move);
  const bypassArmor = effs.some(e => e.action === 'bypass_armor');
  const bypassDodge = effs.some(e => e.action === 'bypass_dodge');
  const removesShield = effs.some(e => e.action === 'remove_shield');
  const isGroupAttack = effs.some(e => e.action === 'attack' && (e.target === 'all_opponents' || e.target === 'team'));
  const isFlock = defender.memberHp.length > 1;

  for (const eff of effs) {
    if (eff.action === 'attack') {
      let dmg = calcDamage(attacker, defender, eff.multiplier ?? 1, bypassArmor, bypassDodge, removesShield, false);
      if (!isGroupAttack && isFlock) {
        dmg = Math.min(dmg, defender.memberHp[weakestAliveIdx(defender)]);
      }
      score += dmg;
    } else if (eff.action === 'dot') {
      const turns = eff.duration?.[0] ?? 2;
      const resist = resistFraction(defender, 'dot');
      score += currentDamage(attacker) * (eff.multiplier ?? 0) * turns * (1 - resist) * 0.7;
    } else if (eff.action === 'rend') {
      const resist = resistFraction(defender, 'rend');
      score += defender.hp * (eff.multiplier ?? 0) * (1 - resist);
    }
  }
  return score;
}

function chooseBestMove(attacker: Fighter, defender: Fighter): Move {
  const available = regularMoves(attacker);
  // Fallback: find any regular move ignoring cooldowns (use the one with lowest cooldown if all blocked)
  if (available.length === 0) {
    const allRegular = attacker.creature.moves.filter(m => m.type === 'regular');
    const sorted = [...allRegular].sort((a, b) => (attacker.cooldowns[a.uuid] ?? 0) - (attacker.cooldowns[b.uuid] ?? 0));
    return sorted[0];
  }
  return available.reduce((best, m) => scoreMoveForDamage(m, attacker, defender) >= scoreMoveForDamage(best, attacker, defender) ? m : best);
}

// ─── Apply a move ─────────────────────────────────────────────────────────────

function applyMove(move: Move, attacker: Fighter, defender: Fighter, events: string[]) {
  const effs = moveEffects(attacker, move);
  const bypassArmor = effs.some(e => e.action === 'bypass_armor');
  const bypassDodge = effs.some(e => e.action === 'bypass_dodge');
  const removesShield = effs.some(e => e.action === 'remove_shield');
  const isGroupAttack = effs.some(e => e.action === 'attack' && (e.target === 'all_opponents' || e.target === 'team'));
  const isFlock = defender.memberHp.length > 1;

  for (const eff of effs) {
    // Determine target in 1v1 context
    const targetsSelf  = eff.target === 'self';
    const targetsOpponent = !targetsSelf && eff.target !== 'team' && eff.target !== 'lowest_hp_teammate';
    const target = targetsSelf ? attacker : defender;

    switch (eff.action) {
      case 'attack': {
        const rawDmg = calcDamage(attacker, defender, eff.multiplier ?? 1, bypassArmor, bypassDodge, removesShield);
        if (isGroupAttack && isFlock) {
          const applied = applyGroupDamage(defender, rawDmg);
          events.push(`${attacker.id} deals ${applied} damage (group)`);
        } else if (!isGroupAttack && isFlock) {
          const { applied, absorbed } = applyMemberDamage(defender, rawDmg);
          const flockNote = absorbed ? ' [Absorbed]' : '';
          events.push(`${attacker.id} deals ${applied} damage${flockNote}`);
        } else {
          defender.hp = Math.max(0, defender.hp - rawDmg);
          events.push(`${attacker.id} deals ${rawDmg} damage`);
        }
        break;
      }
      case 'dot': {
        if (!targetsOpponent) break;
        const resist = resistFraction(defender, 'dot');
        const dmgPerTick = Math.round(currentDamage(attacker) * (eff.multiplier ?? 0) * (1 - resist));
        if (dmgPerTick > 0) {
          addEffect(defender, 'dot', dmgPerTick, eff.duration);
          events.push(`${attacker.id} applies DoT (${dmgPerTick} per turn)`);
        }
        break;
      }
      case 'rend': {
        if (!targetsOpponent) break;
        const resist = resistFraction(defender, 'rend');
        const dmg = Math.round(defender.hp * (eff.multiplier ?? 0) * (1 - resist));
        defender.hp = Math.max(0, defender.hp - dmg);
        events.push(`${attacker.id} rends ${dmg} HP`);
        break;
      }
      case 'shield': {
        addEffect(target, 'shield', eff.multiplier ?? 0.5, eff.duration);
        events.push(`${target.id} gains ${((eff.multiplier ?? 0.5) * 100).toFixed(0)}% shield`);
        break;
      }
      case 'dodge': {
        addEffect(target, 'dodge', eff.multiplier ?? 0.67, eff.duration);
        events.push(`${target.id} gains dodge`);
        break;
      }
      case 'cloak': {
        addEffect(target, 'cloak', 1, eff.duration);
        events.push(`${target.id} cloaks`);
        break;
      }
      case 'damage_increase': {
        addEffect(target, 'damage_increase', eff.multiplier ?? 0, eff.duration);
        events.push(`${target.id} +${((eff.multiplier ?? 0) * 100).toFixed(0)}% damage`);
        break;
      }
      case 'damage_decrease': {
        if (!targetsOpponent) break;
        const resist = resistFraction(defender, 'damage_decrease');
        const effectiveMult = (eff.multiplier ?? 0) * (1 - resist);
        if (effectiveMult > 0) {
          addEffect(defender, 'damage_decrease', effectiveMult, eff.duration);
          events.push(`${defender.id} distracted (−${(effectiveMult * 100).toFixed(0)}% damage)`);
        }
        break;
      }
      case 'crit_increase': {
        addEffect(target, 'crit_increase', eff.multiplier ?? 0, eff.duration);
        events.push(`${target.id} +${((eff.multiplier ?? 0) * 100).toFixed(0)}% crit`);
        break;
      }
      case 'crit_decrease': {
        if (!targetsOpponent) break;
        const resist = resistFraction(defender, 'crit_decrease');
        const effectiveMult = (eff.multiplier ?? 0) * (1 - resist);
        if (effectiveMult > 0) {
          addEffect(defender, 'crit_decrease', effectiveMult, eff.duration);
          events.push(`${defender.id} −${(effectiveMult * 100).toFixed(0)}% crit`);
        }
        break;
      }
      case 'speed_increase': {
        addEffect(target, 'speed_increase', eff.multiplier ?? 0, eff.duration);
        events.push(`${target.id} +${((eff.multiplier ?? 0) * 100).toFixed(0)}% speed`);
        break;
      }
      case 'speed_decrease': {
        if (!targetsOpponent) break;
        const resist = resistFraction(defender, 'speed_decrease');
        const effectiveMult = (eff.multiplier ?? 0) * (1 - resist);
        if (effectiveMult > 0) {
          addEffect(defender, 'speed_decrease', effectiveMult, eff.duration);
          events.push(`${defender.id} slowed (−${(effectiveMult * 100).toFixed(0)}% speed)`);
        }
        break;
      }
      case 'stun': {
        if (!targetsOpponent) break;
        const resist = resistFraction(defender, 'stun');
        const stunChance = 1 - resist;
        if (stunChance >= 0.5) { // treat as landing if ≥50% chance
          const turns = eff.duration?.[0] ?? 1;
          defender.stunTurns = Math.max(defender.stunTurns, turns);
          events.push(`${defender.id} stunned for ${turns} turn${turns > 1 ? 's' : ''}`);
        }
        break;
      }
      case 'heal': {
        const healed = Math.round(target.maxHp * (eff.multiplier ?? 0));
        target.hp = Math.min(target.maxHp, target.hp + healed);
        events.push(`${target.id} heals ${healed} HP`);
        break;
      }
      case 'heal_pct': {
        const healed = Math.round(target.maxHp * (eff.multiplier ?? 0));
        target.hp = Math.min(target.maxHp, target.hp + healed);
        events.push(`${target.id} heals ${healed} HP`);
        break;
      }
      case 'vulner': {
        if (!targetsOpponent) break;
        const resist = resistFraction(defender, 'vulner');
        const effectiveMult = (eff.multiplier ?? 0) * (1 - resist);
        if (effectiveMult > 0) {
          addEffect(defender, 'vulner', effectiveMult, eff.duration);
          events.push(`${defender.id} vulnerable (+${(effectiveMult * 100).toFixed(0)}% damage taken)`);
        }
        break;
      }
      case 'daze': {
        if (!targetsOpponent) break;
        const resist = resistFraction(defender, 'daze');
        if (resist < 1) {
          addEffect(defender, 'daze', 1, eff.duration);
          events.push(`${defender.id} is dazed (crit nullified)`);
        }
        break;
      }
      case 'remove_shield':    removeEffects(target, 'shield');    break;
      case 'remove_dodge':     removeEffects(target, 'dodge');     break;
      case 'remove_cloak':     removeEffects(target, 'cloak');     break;
      case 'remove_dot':       removeEffects(target, 'dot');       break;
      case 'remove_vulner':    removeEffects(target, 'vulner');    break;
      case 'remove_damage_increase': removeEffects(target, 'damage_increase'); break;
      case 'remove_damage_decrease': removeEffects(target, 'damage_decrease'); break;
      case 'remove_speed_increase':  removeEffects(target, 'speed_increase');  break;
      case 'remove_speed_decrease':  removeEffects(target, 'speed_decrease');  break;
      case 'remove_all_neg': {
        const negEffects = ['damage_decrease','speed_decrease','stun','dot','vulner','armor_decrease','crit_decrease'];
        negEffects.forEach(a => removeEffects(target, a));
        break;
      }
      case 'remove_all_pos': {
        const posEffects = ['damage_increase','speed_increase','shield','dodge','cloak','armor_increase','crit_increase'];
        posEffects.forEach(a => removeEffects(target, a));
        break;
      }
      // Ignored in 1v1: bypass_armor, bypass_dodge, bypass_alert, run, swap_prevent, taunt, cheat_death, daze
    }
  }

  // Set cooldown (use alert version cooldown if applicable)
  const cd = moveCooldown(attacker, move);
  if (cd > 0) attacker.cooldowns[move.uuid] = cd + 1; // +1 because we decrement at start of next turn
}

// ─── End-of-turn bookkeeping ──────────────────────────────────────────────────

function tickFighter(f: Fighter, events: string[]) {
  // DoT ticks — multiplier stores pre-computed absolute damage per tick
  const dot = getEffect(f, 'dot');
  if (dot) {
    f.hp = Math.max(0, f.hp - dot.multiplier);
    events.push(`${f.id} takes ${dot.multiplier} DoT damage`);
  }

  // Decrement effect durations
  f.effects = f.effects.filter(e => {
    if (e.turnsLeft > 0) {
      e.turnsLeft -= 1;
      return e.turnsLeft > 0;
    }
    return e.turnsLeft === -1;
  });

  // Decrement cooldowns
  for (const uuid of Object.keys(f.cooldowns)) {
    f.cooldowns[uuid] = Math.max(0, f.cooldowns[uuid] - 1);
  }

  // Decrement delays
  for (const uuid of Object.keys(f.delayLeft)) {
    f.delayLeft[uuid] = Math.max(0, f.delayLeft[uuid] - 1);
  }

  // Decrement stun
  if (f.stunTurns > 0) f.stunTurns -= 1;
}

// ─── Team Battle (4v4, first to 3 deaths wins) ───────────────────────────────

export interface TeamBattleResult {
  winner: 'A' | 'B' | 'draw';
  deathsA: number;
  deathsB: number;
}

interface TeamSide {
  id: 'A' | 'B';
  fighters: Fighter[];
  activeIdx: number;
  deaths: number;
  justSwappedIn: boolean;
}

function teamActive(s: TeamSide): Fighter { return s.fighters[s.activeIdx]; }

function estimateSwapInDamage(incoming: Fighter, opponent: Fighter): number {
  let total = 0;
  for (const move of incoming.creature.moves) {
    if (move.type !== 'swap_in') continue;
    const effs = moveEffects(incoming, move);
    const bypassArmor = effs.some(e => e.action === 'bypass_armor');
    const bypassDodge  = effs.some(e => e.action === 'bypass_dodge');
    const removesShield = effs.some(e => e.action === 'remove_shield');
    const isGroup = effs.some(e => e.action === 'attack' && (e.target === 'all_opponents' || e.target === 'team'));
    for (const eff of effs) {
      if (eff.action !== 'attack') continue;
      const raw = calcDamage(incoming, opponent, eff.multiplier ?? 1, bypassArmor, bypassDodge, removesShield, false);
      const isFlock = opponent.memberHp.length > 1;
      total += (!isGroup && isFlock) ? Math.min(raw, opponent.memberHp[weakestAliveIdx(opponent)]) : raw;
    }
  }
  return total;
}

function pickSwapTarget(side: TeamSide, opponent: Fighter): number {
  if (side.justSwappedIn) return -1;
  const act = teamActive(side);
  if (hasEffect(act, 'swap_prevent')) return -1;

  const myEV    = scoreMoveForDamage(chooseBestMove(act, opponent), act, opponent);
  const theirEV = scoreMoveForDamage(chooseBestMove(opponent, act), opponent, act);
  const ratio   = myEV / Math.max(1, theirEV);

  // Only consider swapping when clearly losing this matchup
  if (ratio >= 0.7 && act.hp / act.maxHp >= 0.35) return -1;

  let bestIdx = -1, bestScore = myEV * 0.4; // must clear this threshold

  for (let i = 0; i < side.fighters.length; i++) {
    if (i === side.activeIdx || side.fighters[i].hp <= 0) continue;
    const bench = side.fighters[i];
    const siDmg = estimateSwapInDamage(bench, opponent);
    const benchEV = scoreMoveForDamage(chooseBestMove(bench, opponent), bench, opponent);
    const score = siDmg + benchEV * 0.8;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestIdx;
}

function pickForcedReplacement(side: TeamSide, opponent: Fighter): number {
  let best = -1, bestScore = -Infinity;
  for (let i = 0; i < side.fighters.length; i++) {
    if (i === side.activeIdx || side.fighters[i].hp <= 0) continue;
    const score = scoreMoveForDamage(chooseBestMove(side.fighters[i], opponent), side.fighters[i], opponent);
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

function doSwap(side: TeamSide, newIdx: number, opponent: Fighter) {
  const leaving = teamActive(side);
  const sink: string[] = [];
  for (const move of leaving.creature.moves.filter(m => m.type === 'on_escape')) {
    applyMove(move, leaving, opponent, sink);
  }
  side.activeIdx = newIdx;
  side.justSwappedIn = true;
  const incoming = teamActive(side);
  for (const move of incoming.creature.moves.filter(m => m.type === 'swap_in')) {
    applyMove(move, incoming, opponent, sink);
  }
}

// Returns true if match should end (side hit 3 deaths or no replacements left)
function handleDeath(dyingSide: TeamSide, opponent: Fighter): boolean {
  dyingSide.deaths++;
  if (dyingSide.deaths >= 3) return true;
  const next = pickForcedReplacement(dyingSide, opponent);
  if (next < 0) return true;
  dyingSide.activeIdx = next;
  dyingSide.justSwappedIn = false;
  return false;
}

export function simulateTeamBattle(
  teamA: Creature[], teamB: Creature[], config: BattleConfig,
): TeamBattleResult {
  const level = config.levelA;
  const sideA: TeamSide = { id: 'A', fighters: teamA.map(c => initFighter('A', c, level, config.boostsA)), activeIdx: 0, deaths: 0, justSwappedIn: false };
  const sideB: TeamSide = { id: 'B', fighters: teamB.map(c => initFighter('B', c, level, config.boostsB)), activeIdx: 0, deaths: 0, justSwappedIn: false };
  const sink: string[] = [];

  outer: for (let turn = 1; turn <= 200; turn++) {
    // ── Swap phase (simultaneous) ──────────────────────────────────────────
    const swapA = pickSwapTarget(sideA, teamActive(sideB));
    const swapB = pickSwapTarget(sideB, teamActive(sideA));
    if (swapA >= 0) doSwap(sideA, swapA, teamActive(sideB));
    if (swapB >= 0) doSwap(sideB, swapB, teamActive(sideA));

    // Deaths from swap-in moves
    if (teamActive(sideB).hp <= 0 && handleDeath(sideB, teamActive(sideA))) break outer;
    if (teamActive(sideA).hp <= 0 && handleDeath(sideA, teamActive(sideB))) break outer;

    // ── Attack phase (non-swappers only) ──────────────────────────────────
    const aAttacks = swapA < 0, bAttacks = swapB < 0;

    if (aAttacks && bAttacks) {
      const actA = teamActive(sideA), actB = teamActive(sideB);
      const moveA = chooseBestMove(actA, actB), moveB = chooseBestMove(actB, actA);
      const spdA = currentSpeed(actA), spdB = currentSpeed(actB);
      const prioA = movePriority(actA, moveA) + (spdA >= spdB ? 0.5 : 0);
      const prioB = movePriority(actB, moveB) + (spdB > spdA ? 0.5 : 0);
      const [first, second, firstMove, secondMove, firstSide, secondSide] = prioA >= prioB
        ? [actA, actB, moveA, moveB, sideA, sideB]
        : [actB, actA, moveB, moveA, sideB, sideA];

      if (first.stunTurns > 0) { first.stunTurns--; }
      else {
        applyMove(firstMove, first, second, sink);
        if (second.hp > 0) for (const cm of counterMoves(second)) applyMove(cm, second, first, sink);
      }

      if (second.hp <= 0) {
        if (handleDeath(secondSide, first)) break outer;
      } else {
        if (second.stunTurns > 0) { second.stunTurns--; }
        else {
          applyMove(secondMove, second, first, sink);
          if (first.hp > 0) for (const cm of counterMoves(first)) applyMove(cm, first, second, sink);
        }
        if (first.hp <= 0 && handleDeath(firstSide, second)) break outer;
      }
    } else if (aAttacks) {
      const actA = teamActive(sideA), tgt = teamActive(sideB);
      const move = chooseBestMove(actA, tgt);
      if (actA.stunTurns > 0) { actA.stunTurns--; }
      else {
        applyMove(move, actA, tgt, sink);
        if (tgt.hp > 0) for (const cm of counterMoves(tgt)) applyMove(cm, tgt, actA, sink);
      }
      if (tgt.hp <= 0 && handleDeath(sideB, actA)) break outer;
      if (actA.hp <= 0 && handleDeath(sideA, tgt)) break outer;
    } else if (bAttacks) {
      const actB = teamActive(sideB), tgt = teamActive(sideA);
      const move = chooseBestMove(actB, tgt);
      if (actB.stunTurns > 0) { actB.stunTurns--; }
      else {
        applyMove(move, actB, tgt, sink);
        if (tgt.hp > 0) for (const cm of counterMoves(tgt)) applyMove(cm, tgt, actB, sink);
      }
      if (tgt.hp <= 0 && handleDeath(sideA, actB)) break outer;
      if (actB.hp <= 0 && handleDeath(sideB, tgt)) break outer;
    }

    // ── End of turn ────────────────────────────────────────────────────────
    tickFighter(teamActive(sideA), sink);
    tickFighter(teamActive(sideB), sink);
    sideA.justSwappedIn = false;
    sideB.justSwappedIn = false;

    if (sideA.deaths >= 3 || sideB.deaths >= 3) break outer;
  }

  let winner: 'A' | 'B' | 'draw';
  if (sideA.deaths >= 3 && sideB.deaths >= 3) winner = 'draw';
  else if (sideB.deaths >= 3) winner = 'A';
  else if (sideA.deaths >= 3) winner = 'B';
  else winner = sideA.deaths <= sideB.deaths ? 'A' : 'B';

  return { winner, deathsA: sideA.deaths, deathsB: sideB.deaths };
}

// ─── Main simulation ──────────────────────────────────────────────────────────

const MAX_TURNS = 50;

export function simulateBattle(creatureA: Creature, creatureB: Creature, config: BattleConfig): BattleResult {
  const A = initFighter('A', creatureA, config.levelA, config.boostsA);
  const B = initFighter('B', creatureB, config.levelB, config.boostsB);
  const log: BattleLogEntry[] = [];

  for (let turn = 1; turn <= MAX_TURNS && A.hp > 0 && B.hp > 0; turn++) {
    // Determine action order this round
    const spdA = currentSpeed(A);
    const spdB = currentSpeed(B);
    // Priority move selection (we need to pick moves first to check priority)
    const moveA = chooseBestMove(A, B);
    const moveB = chooseBestMove(B, A);
    const prioA = movePriority(A, moveA) + (spdA >= spdB ? 0.5 : 0);
    const prioB = movePriority(B, moveB) + (spdB > spdA ? 0.5 : 0);

    const [first, second, firstMove, secondMove] = prioA >= prioB
      ? [A, B, moveA, moveB]
      : [B, A, moveB, moveA];

    // First fighter's action
    {
      const events: string[] = [];
      if (first.stunTurns > 0) {
        events.push(`${first.id} is stunned — skips turn`);
      } else {
        const firstAlert = inAlert(first, firstMove) ? ' [Alert]' : '';
        events.push(`${first.id} uses ${firstMove.name}${firstAlert}`);
        applyMove(firstMove, first, second, events);
        // Apply counter moves from second (if still alive)
        if (second.hp > 0) {
          for (const cm of counterMoves(second)) {
            applyMove(cm, second, first, events);
          }
        }
      }
      log.push({ turn, actor: first.id, moveName: first.stunTurns > 0 ? 'Stunned' : firstMove.name, events, hpA: A.hp, hpB: B.hp });
    }

    if (second.hp <= 0) break;

    // Second fighter's action
    {
      const events: string[] = [];
      if (second.stunTurns > 0) {
        events.push(`${second.id} is stunned — skips turn`);
      } else {
        const secondAlert = inAlert(second, secondMove) ? ' [Alert]' : '';
        events.push(`${second.id} uses ${secondMove.name}${secondAlert}`);
        applyMove(secondMove, second, first, events);
        // Apply counter moves from first (if still alive)
        if (first.hp > 0) {
          for (const cm of counterMoves(first)) {
            applyMove(cm, first, second, events);
          }
        }
      }
      log.push({ turn, actor: second.id, moveName: second.stunTurns > 0 ? 'Stunned' : secondMove.name, events, hpA: A.hp, hpB: B.hp });
    }

    if (first.hp <= 0) break;

    // End of round — tick both
    const tickEvents: string[] = [];
    tickFighter(A, tickEvents);
    tickFighter(B, tickEvents);
    if (tickEvents.length > 0) {
      log.push({ turn, actor: 'system', moveName: 'End of round', events: tickEvents, hpA: A.hp, hpB: B.hp });
    }

    if (A.hp <= 0 || B.hp <= 0) break;
  }

  let winner: 'A' | 'B' | 'draw';
  if (A.hp <= 0 && B.hp <= 0) winner = 'draw';
  else if (B.hp <= 0) winner = 'A';
  else if (A.hp <= 0) winner = 'B';
  else winner = A.hp >= B.hp ? 'A' : 'B'; // time limit — most HP wins

  const lastLog = log[log.length - 1];
  return { winner, turns: log.filter(l => l.actor !== 'system').length, hpA: Math.max(0, A.hp), hpB: Math.max(0, B.hp), maxHpA: A.maxHp, maxHpB: B.maxHp, log };
}
