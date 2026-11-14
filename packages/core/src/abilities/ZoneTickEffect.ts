import type { Entity } from '../entities/Entity';
import type { SpellZoneRuntime } from '../components/SpellZoneRuntime';
import type { AbilityEffectContext } from './AbilityEffect.types';

/** Ticks one content-selected area behaviour; true retires the area. */
export interface ZoneTickEffect {
  /** Applies the area at its age in ticks. */
  tick(zone: Entity, runtime: SpellZoneRuntime, context: AbilityEffectContext): boolean;
}
