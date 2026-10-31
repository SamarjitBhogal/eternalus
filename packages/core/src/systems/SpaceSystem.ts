import { Transform } from '../components/Transform';
import { Unit } from '../entities/Unit';
import type { SpaceIndex } from '../physics/SpaceIndex';
import type { System, SystemContext } from './System.types';

/**
 * Refills the state's neighbour index (`state.space`, architecture 11 §3) with every unit's
 * position, in store order. Runs right after `MovementSystem`, so steering and next tick's
 * decisions see this tick's positions.
 */
export class SpaceSystem implements System {
  public readonly name = 'space';

  /** @param space - The index `state.space` exposes. */
  public constructor(private readonly space: SpaceIndex) {}

  /** Rebuilds the index over the units' current positions. */
  public update({ state }: SystemContext): void {
    this.space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const position = entity instanceof Unit ? entity.findComponent(Transform)?.position : null;
      if (position !== undefined && position !== null) {
        this.space.add(entity.id, position.x, position.y);
      }
    });
    this.space.commit();
  }
}
