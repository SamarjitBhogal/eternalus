import type { AuthoredLegendJump } from './legendJump.types';

/**
 * The jump every Legend makes on Space (DEC-390, owner 2026-11-27): it rises along a fixed arc
 * and keeps the speed and direction it had at takeoff until it lands. One record for every class
 * (DEC-420, HC-Q123 B): every class keeps these numbers for the MVP; per-class heights come after
 * the MVP, as a keyed lookup.
 */
export const LEGEND_JUMP: AuthoredLegendJump = {
  airSeconds: 0.6, // TUNE: DEC-420
  peakHeight: 1.5, // TUNE: m, DEC-420
};
