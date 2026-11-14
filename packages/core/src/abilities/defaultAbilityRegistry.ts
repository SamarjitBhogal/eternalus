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
 * names effect, restriction and shape classes. A new kind is one class and one line here. Every
 * ability is resolved before this returns, so a missing strategy fails at boot.
 *
 * @param abilities - The loaded abilities (`loadAbilities`).
 * @throws ContentValidationError when an ability names an effect, shape or restriction kind with no
 *   line here.
 */
export const createDefaultAbilityRegistry = (abilities: AbilitySource): AbilityRegistry => {
  const registry = new AbilityRegistry(abilities);
  registry.registerEffect(new DamageEffect());
  registry.registerEffect(new DebuffEffect());
  registry.registerEffect(new KnockbackEffect());
  registry.registerEffect(new DashEffect());
  registry.registerShape(new CircleShape());
  registry.registerShape(new PathShape());
  registry.registerRestriction(new MinLevelRestriction());
  registry.resolveAll();
  return registry;
};
