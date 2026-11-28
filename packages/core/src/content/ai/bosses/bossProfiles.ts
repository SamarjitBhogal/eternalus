import { TickRate } from '../../../utils/TickRate';
import type { BossMoveDefinition, BossProfileDefinition } from '../ai.types';
import { GREATER_BOSS_PROFILE } from './greaterBoss';

/** Every boss profile by id (architecture 11 §2); a boss names one with `aiProfile`. */
export const BOSS_PROFILES: Readonly<Record<string, BossProfileDefinition>> = {
  [GREATER_BOSS_PROFILE.id]: GREATER_BOSS_PROFILE,
};

/** Every boss move by id, for the system that lands it. */
export const BOSS_MOVES: Readonly<Record<string, BossMoveDefinition>> = Object.fromEntries(
  Object.values(BOSS_PROFILES).flatMap(({ moves }) => moves.map((move) => [move.id, move])),
);

/**
 * Each boss profile's moves with their telegraph in ticks at `tickRate`, by profile id and move id:
 * the moves a boss with that profile may start, and when each lands (`boss-move`).
 */
export const loadBossTelegraphTicks = (
  tickRate: number,
): Readonly<Record<string, Readonly<Record<string, number>>>> => {
  const rate = new TickRate(tickRate);
  return Object.fromEntries(
    Object.values(BOSS_PROFILES).map(({ id, moves }) => [
      id,
      Object.fromEntries(moves.map((move) => [move.id, rate.toTicks(move.telegraphSeconds)])),
    ]),
  );
};
