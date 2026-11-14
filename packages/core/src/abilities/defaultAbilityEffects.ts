import type { AbilityEffectSpec } from '../content/abilities/abilities.types';
import type { AbilityEffect } from './AbilityEffect';
import { BuffEffect } from './BuffEffect';
import { PulseEffect } from './PulseEffect';
import { ZoneEffect } from './ZoneEffect';

/** One stateless strategy per spell effect key. */
export const createDefaultAbilityEffects = (): Readonly<
  Record<AbilityEffectSpec['kind'], AbilityEffect<AbilityEffectSpec['kind']>>
> => ({
  buff: new BuffEffect(),
  pulse: new PulseEffect(),
  zone: new ZoneEffect(),
});
