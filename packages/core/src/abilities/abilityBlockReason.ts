import type { AbilityRuntime } from '../components/AbilityRuntime';
import type { SpellSlot } from '../components/AbilityRuntime.types';
import type { AbilityDefinition } from '../content/abilities/abilities.types';
import { MAGUS_RESOURCES } from '../content/abilities/magusKit';

/** The same eligibility rule serves successful casting and the player-only HUD projection. */
export const abilityBlockReason = (
  ability: AbilityDefinition,
  runtime: AbilityRuntime,
  tick: number,
  aether: number,
  isDead: boolean,
  hasCannotCast: boolean,
): SpellSlot['blockedBy'] => {
  if (isDead) return 'dead';
  if (hasCannotCast) return 'cannot-cast';
  if (ability.isPreview === true) return null;
  if (runtime.readyAt(ability.slot) > tick) return 'on-cooldown';
  if (aether < ability.aetherCost) return 'not-enough-aether';
  if (ability.slot === 'ability-4' && runtime.charge < MAGUS_RESOURCES.ultimateMax)
    return 'not-charged';
  return null;
};
