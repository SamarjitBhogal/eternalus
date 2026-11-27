import type { AuthoredLegendJump } from './legendJump.types';

/**
 * The jump every Legend makes on Space (DEC-390, owner 2026-11-27): it rises along a fixed arc
 * and keeps the speed and direction it had at takeoff until it lands. One record for every class:
 * a per-class jump is a later keyed lookup. The owner left both numbers open (HC-Q123).
 */
export const LEGEND_JUMP: AuthoredLegendJump = {
  airSeconds: 0.6, // TUNE: HC-Q123
  peakHeight: 1.5, // TUNE: m, HC-Q123
};
