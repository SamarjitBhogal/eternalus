import { Health } from '../components/Health';
import type { EntityId } from '../state/EntityStore.types';
import type { System, SystemContext } from './System.types';

/**
 * Removes every entity whose health reached 0, with the cause `died`, and announces each removal
 * with `entity-removed` (architecture 03 §4). Runs after the systems that deal damage, so a unit
 * killed this tick leaves the world this tick.
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
      state.events.emit('entity-removed', { entityId, cause: 'died' });
    }
  }
}
