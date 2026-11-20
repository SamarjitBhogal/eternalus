import { loadKnockback } from '../content/abilities/loadKnockback';
import { STATUS_EFFECTS } from '../content/status-effects/statusEffectCatalogue';
import { AbilityRegistry } from './AbilityRegistry';
import type { AbilitySource } from './AbilityRegistry.types';
import { BuffEffect } from './effects/BuffEffect';
import { DamageEffect } from './effects/DamageEffect';
import { DashEffect } from './effects/DashEffect';
import { DebuffEffect } from './effects/DebuffEffect';
import { KnockbackEffect } from './effects/KnockbackEffect';
import { MinLevelRestriction } from './restrictions/MinLevelRestriction';
import { CircleShape } from './shapes/CircleShape';
import { HitShape } from './shapes/HitShape';
import { PathShape } from './shapes/PathShape';
import { DirectionalTargeting } from './targeting/DirectionalTargeting';
import { HeadingTargeting } from './targeting/HeadingTargeting';
import { SelfTargeting } from './targeting/SelfTargeting';

/**
 * The ability registry with every built-in strategy (architecture 05 §14): the ONLY file that
 * names effect, restriction, shape and targeting classes, and the place their content is injected (rule 11).
 * A new kind is one class and one line here. Every ability is checked and resolved before this
 * returns, so a missing strategy or a step its strategy refuses fails at boot.
 *
 * @param abilities - The loaded abilities (`loadAbilities`).
 * @param tickRate - Ticks per second (`GameConfig.tickRate`), for the knock-back's travel time
 *   (`loadKnockback`).
 * @param statuses - The statuses a debuff or a buff may name; the shipped ones by default.
 * @throws ContentValidationError when the knock-back tuning is invalid (`loadKnockback`), or
 *   listing every ability that names a kind with no line here or has a step or shape its strategy
 *   refuses.
 */
export const createDefaultAbilityRegistry = (
  abilities: AbilitySource,
  tickRate: number,
  statuses: { has(id: string): boolean } = STATUS_EFFECTS,
): AbilityRegistry => {
  const registry = new AbilityRegistry(abilities);
  registry.registerEffect(new DamageEffect());
  registry.registerEffect(new DebuffEffect(statuses));
  registry.registerEffect(new KnockbackEffect(loadKnockback(tickRate)));
  registry.registerEffect(new DashEffect());
  registry.registerEffect(new BuffEffect(statuses));
  registry.registerShape(new CircleShape());
  registry.registerShape(new PathShape());
  registry.registerShape(new HitShape());
  registry.registerTargeting(new SelfTargeting());
  registry.registerTargeting(new DirectionalTargeting());
  registry.registerTargeting(new HeadingTargeting());
  registry.registerRestriction(new MinLevelRestriction());
  registry.resolveAll();
  return registry;
};
