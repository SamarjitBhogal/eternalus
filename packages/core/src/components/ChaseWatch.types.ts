/**
 * This tick and the stuck rule in ticks, as `ChaseWatch.observe` reads them; `StuckSystem` builds
 * one per tick.
 */
export type StuckWindow = {
  readonly tick: number;
  readonly windowTicks: number;
  readonly minProgress: number;
};
