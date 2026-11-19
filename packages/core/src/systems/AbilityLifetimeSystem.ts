import { AbilityLifetime } from '../components/AbilityLifetime';
import { BeamChannel } from '../components/BeamChannel';
import type { System, SystemContext } from './System.types';

/** Expires temporary ability entities; beam channels own their final inclusive pulse. */
export class AbilityLifetimeSystem implements System {
  public readonly name = 'ability-lifetimes';
  /** Retires after collecting ids, so entity traversal never mutates under itself. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) return;
    const expired: string[] = [];
    state.entities.forEach((entity) => {
      const lifetime = entity.findComponent(AbilityLifetime);
      if (
        lifetime !== undefined &&
        !entity.hasComponent(BeamChannel) &&
        state.tick >= lifetime.expiresTick
      )
        expired.push(entity.id);
    });
    for (const entityId of expired) {
      state.entities.remove(entityId, 'consumed');
      state.events.emit('entity-removed', { entityId, cause: 'consumed' });
    }
  }
}
