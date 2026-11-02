import { Health } from '../components/Health';
import type { EntityId } from '../state/EntityStore.types';
import type { System, SystemContext } from './System.types';

/**
 * Removes every entity whose health reached 0, with the cause `died`, and announces each removal
 * with `entity-removed` carrying the killer from this tick's `entity-died` (architecture 03 §2,
 * §4). Runs after the systems that deal damage, so a unit killed this tick leaves the world this
 * tick. A death with no killer is left for `no-death-without-killer` to report.
 */
export class DeathSystem implements System {
  public readonly name = 'death';

  /** Removes this tick's dead, in store order. */
  public update({ state }: SystemContext): void {
    const dead: EntityId[] = [];
    state.entities.forEach((entity) => {
      if (entity.findComponent(Health)?.isDead === true) {
        dead.push(entity.id);
      }
    });

    for (const entityId of dead) {
      state.entities.remove(entityId, 'died');
      const killer = state.killerOf(entityId);
      state.events.emit('entity-removed', {
        entityId,
        cause: 'died',
        ...(killer !== undefined && { killer }),
      });
    }
  }
}
