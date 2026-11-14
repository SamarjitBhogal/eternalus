/** Test support: real core snapshots for the Duel tests. Imported only by tests. */
import { createDefaultGameConfig, NullLogger, Simulation, type Snapshot } from '@eternalus/core';

/** The snapshot of a fresh simulation after `ticks` steps: `tick` equals `ticks`. */
export function snapshotAtTick(ticks: number): Snapshot {
  const simulation = new Simulation({
    seed: 1,
    logger: new NullLogger(),
    config: createDefaultGameConfig(),
  });
  for (let step = 0; step < ticks; step += 1) simulation.step();
  return simulation.snapshot();
}
