import { KNOCKBACK } from '../content/abilities/knockback';
import { STATUS_EFFECTS } from '../content/status-effects/statusEffectCatalogue';
import { AbilityRegistry } from './AbilityRegistry';
import type { AbilitySource } from './AbilityRegistry.types';
import { DamageEffect } from './effects/DamageEffect';
import { DashEffect } from './effects/DashEffect';
import { DebuffEffect } from './effects/DebuffEffect';
import { KnockbackEffect } from './effects/KnockbackEffect';
import { MinLevelRestriction } from './restrictions/MinLevelRestriction';
import { CircleShape } from './shapes/CircleShape';
import { PathShape } from './shapes/PathShape';

/**
 * The ability registry with every built-in strategy (architecture 05 §14): the ONLY file that
 * names effect, restriction and shape classes, and the place their content is injected (rule 11).
 * A new kind is one class and one line here. Every ability is checked and resolved before this
 * returns, so a missing strategy or a step its strategy refuses fails at boot.
 *
 * @param abilities - The loaded abilities (`loadAbilities`).
 * @param statuses - The statuses a debuff may name; the shipped ones by default.
 * @throws ContentValidationError listing every ability that names a kind with no line here or has
 *   a step or shape its strategy refuses.
 */
export const createDefaultAbilityRegistry = (
  abilities: AbilitySource,
  statuses: { has(id: string): boolean } = STATUS_EFFECTS,
): AbilityRegistry => {
  const registry = new AbilityRegistry(abilities);
  registry.registerEffect(new DamageEffect());
  registry.registerEffect(new DebuffEffect(statuses));
  registry.registerEffect(new KnockbackEffect(KNOCKBACK));
  registry.registerEffect(new DashEffect());
  registry.registerShape(new CircleShape());
  registry.registerShape(new PathShape());
  registry.registerRestriction(new MinLevelRestriction());
  registry.resolveAll();
  return registry;
};
