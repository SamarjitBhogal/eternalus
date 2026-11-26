import { type LoadoutContent, type LoadoutSlot, repairLoadout } from '@eternalus/core';

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
 * Repairs each saved loadout, keyed by `specId`, with core's `repairLoadout` (reference 08 "Saved
 * to the profile"): a slot naming content that no longer exists, or that the Legend's class may
 * not take, gets the auto-build. `options` gives each Legend's class. A Legend `options` does not
 * have, or whose class content does not have, is ignored. Never throws.
 */
export function resolveSavedLoadouts(
  content: LoadoutContent,
  options: LoadoutsSliceState['options'],
  records: ReadonlyMap<string, SavedLoadout>,
): ResolvedLoadouts {
  const saved: Record<string, string> = {};
  const repairs = new Map<string, readonly LoadoutSlot[]>();
  for (const [specId, record] of records) {
    const classId = options[specId]?.classId;
    if (classId === undefined || !content.legends.has(classId)) continue;
    const { loadout, repaired } = repairLoadout({ classId, ...record }, content);
    saved[specId] = loadout.primaryWeaponId;
    if (repaired.length > 0) repairs.set(specId, repaired);
  }
  return { saved, repairs };
}
