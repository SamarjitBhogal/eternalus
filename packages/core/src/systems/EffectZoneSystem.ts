import { SpellZoneRuntime } from '../components/SpellZoneRuntime';
import { Transform } from '../components/Transform';
import { HealingZoneEffect } from '../abilities/HealingZoneEffect';
import type { ZoneTickEffect } from '../abilities/ZoneTickEffect';
import type { AbilityEffectContext } from '../abilities/AbilityEffect.types';
import type { System, SystemContext } from './System.types';

/** Advances authored spell areas independently of their caster's movement or lifetime. */
export class EffectZoneSystem implements System {
  public readonly name = 'spell-zones';
  private readonly effects: Readonly<
    Partial<Record<SpellZoneRuntime['spec']['kind'], ZoneTickEffect>>
  > = { zone: new HealingZoneEffect() };
  /** Receives the same services as casting, without calling the casting system. */
  public constructor(
    private readonly services: Omit<
      AbilityEffectContext,
      'state' | 'caster' | 'abilityId' | 'point'
    >,
  ) {}
  /** Applies one fixed tick of each area and retires expired areas. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) return;
    const retired: string[] = [];
    state.entities.forEach((zone) => {
      const runtime = zone.findComponent(SpellZoneRuntime);
      if (runtime === undefined) return;
      const effect = this.effects[runtime.spec.kind];
      if (
        effect === undefined ||
        effect.tick(zone, runtime, {
          ...this.services,
          state,
          caster: zone,
          abilityId: runtime.abilityId,
          point: zone.getComponent(Transform).position,
        })
      )
        retired.push(zone.id);
    });
    for (const entityId of retired) {
      state.entities.remove(entityId, 'consumed');
      state.events.emit('entity-removed', { entityId, cause: 'consumed' });
    }
  }
}
