import type { Simulation } from '../Simulation';

/**
 * Removes each capture point's defenders (the assist mobs, 18 §7.1) as they spawn, so a soak of
 * other rules is not held by them; the defenders have their own tests
 * (`SpawnSystem.defenders.test.ts`, `Simulation.capture.test.ts`).
 */
export const clearCheckpointDefenders = (simulation: Simulation): void => {
  // Defenders spawn on `SpawnSystem`'s pass of the tick after their checkpoint, so only those
  // ticks' spawns are looked up.
  const spawnTicks = new Set<number>();
  simulation.on('checkpoint-reached', () => {
    spawnTicks.add(simulation.tick + 1);
  });
  simulation.on('entity-spawned', ({ entityId }) => {
    if (!spawnTicks.has(simulation.tick)) {
      return;
    }
    const definitionId = simulation
      .snapshot()
      .entities.find(({ id }) => id === entityId)?.definitionId;
    if (definitionId?.endsWith('-assist-mob') === true) {
      simulation.enqueueCommand({ type: 'dev-remove-entity', entityId });
    }
  });
};
