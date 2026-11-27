import {
  autoBuildLoadout,
  type Loadout,
  type LoadoutContent,
  type LoadoutSlot,
  repairLoadout,
} from '@eternalus/core';

import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import type { SavedLoadout } from './LoadoutController.types';

/** What loading the saved loadouts came to, before the controller publishes and reports it. */
type ResolvedLoadouts = {
  /** The primary weapon of each Legend's saved loadout, repaired where it had to be. */
  readonly saved: Readonly<Record<string, string>>;
  /** The slots auto-build repaired, per Legend; a Legend with none repaired is absent. */
  readonly repairs: ReadonlyMap<string, readonly LoadoutSlot[]>;
};

/**
 * The core `Loadout` of the Legend `specId` with the `saved` slots, or `null` for a Legend
 * `options` does not offer or `content` does not have. Core finds the Legend's class
 * (`autoBuildLoadout`, DEC-418 (2)); the client never looks it up. Content is validated at load,
 * so the class of every Legend it has exists.
 */
export function legendLoadout(
  content: LoadoutContent,
  options: LoadoutsSliceState['options'],
  specId: string,
  saved: SavedLoadout,
): Loadout | null {
  if (options[specId] === undefined || !content.specs.has(specId)) return null;
  return { ...autoBuildLoadout(specId, content), primaryWeaponId: saved.primaryWeaponId };
}

/**
 * Repairs each saved loadout, keyed by `specId`, with core's `repairLoadout` (reference 08 "Saved
 * to the profile"): a slot naming content that no longer exists, or that the Legend's class may
 * not take, gets the Legend's auto-build. A Legend `options` does not offer, or `content` does not
 * have, is ignored (`legendLoadout`). Never throws for content validated at load.
 */
export function resolveSavedLoadouts(
  content: LoadoutContent,
  options: LoadoutsSliceState['options'],
  records: ReadonlyMap<string, SavedLoadout>,
): ResolvedLoadouts {
  const saved: Record<string, string> = {};
  const repairs = new Map<string, readonly LoadoutSlot[]>();
  for (const [specId, record] of records) {
    const loadoutOfRecord = legendLoadout(content, options, specId, record);
    if (loadoutOfRecord === null) continue;
    const { loadout, repaired } = repairLoadout(loadoutOfRecord, content);
    saved[specId] = loadout.primaryWeaponId;
    if (repaired.length > 0) repairs.set(specId, repaired);
  }
  return { saved, repairs };
}
