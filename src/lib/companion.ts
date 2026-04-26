import { Move } from '@/types/creature';
import {
  Fighter, applyMove, chooseBestMove, counterMoves, currentSpeed,
  estimateSwapInDamage, movePriority, regularMoves, scoreMoveForDamage, tickFighter,
} from './battle';

export function cloneFighter(f: Fighter): Fighter {
  return {
    ...f,
    effects: f.effects.map(e => ({ ...e })),
    cooldowns: { ...f.cooldowns },
    delayLeft: { ...f.delayLeft },
    memberHp: [...f.memberHp],
  };
}

export type MoveTag = 'KO' | 'favorable' | 'neutral' | 'risky' | 'losing';

export interface MoveOption {
  move: Move;
  available: boolean;
  myDmg: number;
  oppDmg: number;
  iGoFirst: boolean;
  killsOpp: boolean;
  killsMe: boolean;
  tag: MoveTag;
  score: number;
}

export interface SwapOption {
  fighter: Fighter;
  teamIdx: number;
  swapInDmg: number;
  postSwapDmg: number;
  oppDmgVsNew: number;
  winsMatchup: boolean;
  score: number; // comparable to MoveOption.score
}

// Evaluate all my regular moves vs current opponent and rank them
export function evaluateMoves(me: Fighter, opp: Fighter): MoveOption[] {
  const allMoves = me.creature.moves.filter(m => m.type === 'regular');
  const oppBestMove = chooseBestMove(opp, me);
  const oppDmg = scoreMoveForDamage(oppBestMove, opp, me);
  const oppPrio = movePriority(opp, oppBestMove);
  const oppSpd = currentSpeed(opp);

  return allMoves.map(move => {
    const available = (me.cooldowns[move.uuid] ?? 0) === 0 && (me.delayLeft[move.uuid] ?? 0) === 0;
    const myDmg = scoreMoveForDamage(move, me, opp);
    const myPrio = movePriority(me, move);
    const mySpd = currentSpeed(me);
    const iGoFirst = myPrio > oppPrio || (myPrio === oppPrio && mySpd >= oppSpd);
    const killsOpp = myDmg >= opp.hp;
    const killsMe = !iGoFirst && oppDmg >= me.hp;

    let tag: MoveTag;
    if (killsOpp) tag = 'KO';
    else if (killsMe) tag = 'losing';
    else if (myDmg > oppDmg * 1.25) tag = 'favorable';
    else if (myDmg < oppDmg * 0.6) tag = 'risky';
    else tag = 'neutral';

    let score = myDmg - oppDmg * (iGoFirst ? 0.8 : 1.2);
    if (killsOpp) score += 100000;
    if (killsMe) score -= 50000;
    if (!available) score -= 200000;

    return { move, available, myDmg, oppDmg, iGoFirst, killsOpp, killsMe, tag, score };
  }).sort((a, b) => b.score - a.score);
}

// Rank bench creatures vs current opponent, with a score comparable to MoveOption.score
export function evaluateSwaps(bench: Fighter[], opp: Fighter, me: Fighter): SwapOption[] {
  const myCurrentScore = scoreMoveForDamage(chooseBestMove(me, opp), me, opp)
    - scoreMoveForDamage(chooseBestMove(opp, me), opp, me);

  return bench.map((f, teamIdx) => {
    const swapInDmg = estimateSwapInDamage(f, opp);
    const postSwapDmg = scoreMoveForDamage(chooseBestMove(f, opp), f, opp);
    const oppDmgVsNew = scoreMoveForDamage(chooseBestMove(opp, f), opp, f);
    const netAfterSwap = swapInDmg + postSwapDmg - oppDmgVsNew;
    const winsMatchup = netAfterSwap > 0;
    // Bonus when swap genuinely improves the matchup beyond staying
    const score = netAfterSwap + Math.max(0, netAfterSwap - myCurrentScore) * 0.5;
    return { fighter: f, teamIdx, swapInDmg, postSwapDmg, oppDmgVsNew, winsMatchup, score };
  }).sort((a, b) => b.score - a.score);
}

export function hasRunEffect(move: Move): boolean {
  return move.effects.some(e => e.action === 'run') ||
    (move.if_alert?.effects.some(e => e.action === 'run') ?? false);
}

// Next alive fighter index after activeIdx (wraps through team in order)
export function nextAliveTeamIdx(team: { alive: boolean }[], activeIdx: number): number {
  for (let offset = 1; offset < team.length; offset++) {
    const idx = (activeIdx + offset) % team.length;
    if (idx !== activeIdx && team[idx].alive) return idx;
  }
  return -1;
}

// ── Turn resolution (mutates fighters in place) ───────────────────────────────

// Both players used an attack move
export function resolveMoveExchange(
  me: Fighter, opp: Fighter,
  myMove: Move, oppMove: Move,
): string[] {
  const events: string[] = [];
  const myPrio = movePriority(me, myMove) + (currentSpeed(me) >= currentSpeed(opp) ? 0.5 : 0);
  const oppPrio = movePriority(opp, oppMove) + (currentSpeed(opp) > currentSpeed(me) ? 0.5 : 0);
  const [first, second, fMove, sMove, firstLabel, secondLabel] = myPrio >= oppPrio
    ? [me, opp, myMove, oppMove, 'You', 'Opponent'] as const
    : [opp, me, oppMove, myMove, 'Opponent', 'You'] as const;

  if (first.stunTurns > 0) {
    first.stunTurns--;
    events.push(`${firstLabel} is stunned!`);
  } else {
    applyMove(fMove, first, second, events);
    if (second.hp > 0) for (const cm of counterMoves(second)) applyMove(cm, second, first, events);
  }

  if (second.hp > 0) {
    if (second.stunTurns > 0) {
      second.stunTurns--;
      events.push(`${secondLabel} is stunned!`);
    } else {
      applyMove(sMove, second, first, events);
      if (first.hp > 0) for (const cm of counterMoves(first)) applyMove(cm, first, second, events);
    }
  }

  tickFighter(me, events);
  tickFighter(opp, events);
  return events;
}

// I used a run move — creature attacks then automatically exits, next alive steps in
export function resolveMoveWithRun(
  me: Fighter, myIncoming: Fighter,
  opp: Fighter,
  myMove: Move, oppMove: Move,
): string[] {
  const events: string[] = [];
  const myPrio = movePriority(me, myMove) + (currentSpeed(me) >= currentSpeed(opp) ? 0.5 : 0);
  const oppPrio = movePriority(opp, oppMove) + (currentSpeed(opp) > currentSpeed(me) ? 0.5 : 0);

  if (myPrio >= oppPrio) {
    // I go first: attack → run → opp hits my incoming creature
    if (me.stunTurns > 0) {
      me.stunTurns--;
      events.push('You are stunned — can\'t run this turn');
      // Fall back to normal exchange if stunned
      if (opp.stunTurns > 0) { opp.stunTurns--; }
      else { applyMove(oppMove, opp, me, events); if (me.hp > 0) for (const cm of counterMoves(me)) applyMove(cm, me, opp, events); }
    } else {
      applyMove(myMove, me, opp, events);
      if (opp.hp > 0) for (const cm of counterMoves(opp)) applyMove(cm, opp, me, events);
      // Run: on_escape from me, swap_in from incoming
      for (const m of me.creature.moves.filter(m => m.type === 'on_escape')) applyMove(m, me, opp, events);
      for (const m of myIncoming.creature.moves.filter(m => m.type === 'swap_in')) applyMove(m, myIncoming, opp, events);
      events.push(`${me.creature.name} runs — ${myIncoming.creature.name} steps in`);
      // Opp now attacks my incoming creature
      if (opp.hp > 0) {
        if (opp.stunTurns > 0) { opp.stunTurns--; events.push('Opponent is stunned!'); }
        else { applyMove(oppMove, opp, myIncoming, events); if (myIncoming.hp > 0) for (const cm of counterMoves(myIncoming)) applyMove(cm, myIncoming, opp, events); }
      }
    }
  } else {
    // Opp goes first: attacks me → then I use run move → exit
    if (opp.stunTurns > 0) { opp.stunTurns--; events.push('Opponent is stunned!'); }
    else { applyMove(oppMove, opp, me, events); if (me.hp > 0) for (const cm of counterMoves(me)) applyMove(cm, me, opp, events); }
    if (me.hp > 0) {
      if (me.stunTurns > 0) { me.stunTurns--; events.push('You are stunned!'); }
      else {
        applyMove(myMove, me, opp, events);
        if (opp.hp > 0) for (const cm of counterMoves(opp)) applyMove(cm, opp, me, events);
        for (const m of me.creature.moves.filter(m => m.type === 'on_escape')) applyMove(m, me, opp, events);
        for (const m of myIncoming.creature.moves.filter(m => m.type === 'swap_in')) applyMove(m, myIncoming, opp, events);
        events.push(`${me.creature.name} runs — ${myIncoming.creature.name} steps in`);
      }
    }
  }

  tickFighter(myIncoming, events);
  tickFighter(opp, events);
  return events;
}

// I swapped, opponent attacked my new creature
export function resolveMySwap(
  myLeaving: Fighter, myIncoming: Fighter,
  opp: Fighter, oppMove: Move,
): string[] {
  const events: string[] = [];
  for (const m of myLeaving.creature.moves.filter(m => m.type === 'on_escape'))
    applyMove(m, myLeaving, opp, events);
  for (const m of myIncoming.creature.moves.filter(m => m.type === 'swap_in'))
    applyMove(m, myIncoming, opp, events);
  events.push(`You swapped in ${myIncoming.creature.name}`);
  if (opp.hp > 0) {
    applyMove(oppMove, opp, myIncoming, events);
    if (myIncoming.hp > 0) for (const cm of counterMoves(myIncoming)) applyMove(cm, myIncoming, opp, events);
  }
  tickFighter(myIncoming, events);
  tickFighter(opp, events);
  return events;
}

// Opponent swapped, I attacked their new creature
export function resolveOppSwap(
  me: Fighter, myMove: Move,
  oppLeaving: Fighter, oppIncoming: Fighter,
): string[] {
  const events: string[] = [];
  for (const m of oppLeaving.creature.moves.filter(m => m.type === 'on_escape'))
    applyMove(m, oppLeaving, me, events);
  for (const m of oppIncoming.creature.moves.filter(m => m.type === 'swap_in'))
    applyMove(m, oppIncoming, me, events);
  events.push(`Opponent swapped in ${oppIncoming.creature.name}`);
  if (me.hp > 0) {
    applyMove(myMove, me, oppIncoming, events);
    if (oppIncoming.hp > 0) for (const cm of counterMoves(oppIncoming)) applyMove(cm, oppIncoming, me, events);
  }
  tickFighter(me, events);
  tickFighter(oppIncoming, events);
  return events;
}

// Both swapped — only swap interactions fire, no attacks
export function resolveBothSwap(
  myLeaving: Fighter, myIncoming: Fighter,
  oppLeaving: Fighter, oppIncoming: Fighter,
): string[] {
  const events: string[] = [];
  for (const m of myLeaving.creature.moves.filter(m => m.type === 'on_escape'))
    applyMove(m, myLeaving, oppIncoming, events);
  for (const m of myIncoming.creature.moves.filter(m => m.type === 'swap_in'))
    applyMove(m, myIncoming, oppIncoming, events);
  events.push(`You swapped in ${myIncoming.creature.name}`);
  for (const m of oppLeaving.creature.moves.filter(m => m.type === 'on_escape'))
    applyMove(m, oppLeaving, myIncoming, events);
  for (const m of oppIncoming.creature.moves.filter(m => m.type === 'swap_in'))
    applyMove(m, oppIncoming, myIncoming, events);
  events.push(`Opponent swapped in ${oppIncoming.creature.name}`);
  return events;
}

export { regularMoves };
