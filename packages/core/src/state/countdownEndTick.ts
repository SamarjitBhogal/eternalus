import type { GameConfig } from '../config/GameConfig.types';

/**
 * The tick the match countdown ends, rounded to a whole tick: when the wave clocks start (DEC-87)
 * and the ghosted first wave counts from (11 §4.3). Every reader uses this, so they agree on the
 * tick even for a fractional `countdownSeconds` (X57-F7).
 */
export const countdownEndTick = ({
  tickRate,
  match,
}: Pick<GameConfig, 'tickRate' | 'match'>): number => Math.round(match.countdownSeconds * tickRate);
