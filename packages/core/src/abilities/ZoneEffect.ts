import { Transform } from '../components/Transform';
import { SpellZoneRuntime } from '../components/SpellZoneRuntime';
import { SPELL_ZONE } from '../content/zones/spellZone';
import { SPELL_AREA_SIDES } from '../content/abilities/magusKit';
import { regularPolygon } from '../utils/geometry';
import type { AbilityEffect } from './AbilityEffect';
import type { AbilityEffectContext } from './AbilityEffect.types';
import type { AbilityEffectSpec } from '../content/abilities/abilities.types';

/** Creates a transient area through the entity factory, leaving ticking to its own system. */
export class ZoneEffect implements AbilityEffect<'zone'> {
  /** Sanctuary uses a stationary area with authored healing data. */
  public apply(
    spec: Extract<AbilityEffectSpec, { kind: 'zone' }>,
    { state, caster, abilityId, factory }: AbilityEffectContext,
  ): void {
    const position = { ...caster.getComponent(Transform).position };
    const zone = factory.create('effect-zone', SPELL_ZONE.id, {
      position,
      team: state.entities.teamOf(caster.id) ?? 'neutral',
      area: [regularPolygon(position, spec.radius, SPELL_AREA_SIDES)],
    });
    zone.addComponent(new SpellZoneRuntime(caster.id, abilityId, state.tick, spec));
    state.entities.add(zone);
  }
}
