import type { StatusTickKind } from '../content/status-effects/statusEffects.types';
import { DamageStatusTick } from './DamageStatusTick';
import type { StatusTickEffect } from './StatusTickEffect.types';

/** Every periodic tick kind; a missing kind does not compile. One line per kind. */
export const createDefaultStatusTickEffects = (): Readonly<
  Record<StatusTickKind, StatusTickEffect>
> => ({
  damage: new DamageStatusTick(),
});
