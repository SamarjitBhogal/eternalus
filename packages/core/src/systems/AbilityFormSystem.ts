import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { Abilities } from '../components/Abilities';
import type { System, SystemContext } from './System.types';

/** Projects temporary form-size modifiers into the actual collision footprint. */
export class AbilityFormSystem implements System {
  public readonly name = 'ability-forms';
  /** Setting a multiplier relative to the immutable base avoids growth/shrink drift. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const statuses = entity.findComponent(StatusEffects);
      if (transform !== undefined) transform.setSizeMultiplier(statuses?.multiplier('size') ?? 1);
      for (const slot of entity.findComponent(Abilities)?.slots ?? [])
        if (slot.recastUntilTick !== 0 && !slot.isRecastActive(state.tick, statuses))
          slot.endRecastWindow();
    });
  }
}
