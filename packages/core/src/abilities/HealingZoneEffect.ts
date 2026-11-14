import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { distance } from '../utils/geometry';
import type { Entity } from '../entities/Entity';
import type { SpellZoneRuntime } from '../components/SpellZoneRuntime';
import type { AbilityEffectContext } from './AbilityEffect.types';
import type { ZoneTickEffect } from './ZoneTickEffect';

/** Sanctuary restores living allies continuously, capped by their health component. */
export class HealingZoneEffect implements ZoneTickEffect {
  /** Heals a fixed fraction per simulation second, never reviving dead entities. */
  public tick(zone: Entity, runtime: SpellZoneRuntime, { state }: AbilityEffectContext): boolean {
    const spec = runtime.spec;
    const age = state.tick - runtime.startedTick;
    if (age >= Math.round(spec.durationSeconds * state.config.tickRate)) return true;
    const origin = zone.getComponent(Transform).position;
    state.entities.forEach((ally) => {
      const at = ally.findComponent(Transform),
        health = ally.findComponent(Health);
      if (
        at !== undefined &&
        health?.isDead === false &&
        state.entities.teamOf(ally.id) === state.entities.teamOf(zone.id) &&
        distance(origin, at.position) <= spec.radius
      )
        health.heal((health.max * spec.healFractionPerSecond) / state.config.tickRate);
    });
    return false;
  }
}
