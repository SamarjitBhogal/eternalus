import type { Simulation } from '../Simulation';

/**
 * Removes each capture point's defenders as they spawn (on the tick after their
 * `checkpoint-reached`, 18 §7.1), so a test of the capture rules is not held by them; the
 * defenders have their own tests (`SpawnSystem.defenders.test.ts`).
 */
export const clearCheckpointDefenders = (simulation: Simulation): void => {
  const spawnTicks = new Set<number>();
  simulation.on('checkpoint-reached', () => {
    spawnTicks.add(simulation.tick + 1);
  });
  simulation.on('entity-spawned', ({ entityId, kind }) => {
    if (spawnTicks.has(simulation.tick) && kind.endsWith('-mob')) {
      simulation.enqueueCommand({ type: 'dev-remove-entity', entityId });
    }
  });
};
