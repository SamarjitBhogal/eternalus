import type { EntityId, EntitySnapshot, Simulation, Snapshot, Unsubscribe } from '@eternalus/core';

import type { LegendBody } from './views/LegendBodyLayer.types';

/**
 * Where Legends died, so their bodies stay on the map for the rest of the match (DEC-295: "make
 * sure dead-legend sprites stay on the map after death"). A Legend removed with the cause `died`
 * leaves a body where the latest snapshot last had it; a Legend that respawns later is a living
 * entity again, and its body stays where it fell. Presentation only: core keeps no bodies. It
 * reads the simulation's events through `Simulation.on`, as `HealthBarVisibility` does; the view
 * gets only `bodies`.
 */
export class LegendBodies {
  private readonly fallen: LegendBody[] = [];

  /** The Legends of the latest snapshot, by id. */
  private legends: ReadonlyMap<EntityId, EntitySnapshot> = new Map();

  private readonly unsubscribe: Unsubscribe;

  /** Starts listening to `entity-removed`; `destroy` stops. */
  public constructor(simulation: Pick<Simulation, 'on'>) {
    this.unsubscribe = simulation.on('entity-removed', ({ entityId, cause }) => {
      const at = cause === 'died' ? this.legends.get(entityId)?.transform : null;
      if (at !== null && at !== undefined) {
        this.fallen.push({ x: at.x, y: at.y, radius: at.radius });
      }
    });
  }

  /** Every body so far, in the order the Legends fell. Bound, so a view can hold it. */
  public readonly bodies = (): readonly LegendBody[] => this.fallen;

  /** Reads the latest snapshot's Legends; call it for the first snapshot and after each step. */
  public observe(snapshot: Snapshot): void {
    this.legends = new Map(
      snapshot.entities
        .filter((entity) => entity.family === 'legend')
        .map((entity) => [entity.id, entity]),
    );
  }

  /** Stops listening. */
  public destroy(): void {
    this.unsubscribe();
  }
}
