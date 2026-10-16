import type { StatusTickEffectId } from '../content/status-effects/statusEffects.types';
import { MaxHealthDamageEffect } from './MaxHealthDamageEffect';
import { PeriodicDamageEffect } from './PeriodicDamageEffect';
import type { StatusTickEffect } from './StatusTickEffect.types';

/** Every periodic status effect by id; a missing id does not compile. One line per effect. */
export const createDefaultStatusTickEffects = (): Readonly<
  Record<StatusTickEffectId, StatusTickEffect>
> => ({
  damage: new PeriodicDamageEffect(),
  'max-health-damage': new MaxHealthDamageEffect(),
});
