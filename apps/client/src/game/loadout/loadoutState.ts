import { type LoadoutContent, type LoadoutSlot, repairLoadout } from '@eternalus/core';

import type { SavedLoadout } from './LoadoutController.types';

/** What loading the saved loadouts came to, before the controller publishes and reports it. */
type ResolvedLoadouts = {
  /** The primary weapon of each class's saved loadout, repaired where it had to be. */
  readonly saved: Readonly<Record<string, string>>;
  /** The slots auto-build repaired, per class; a class with none repaired is absent. */
  readonly repairs: ReadonlyMap<string, readonly LoadoutSlot[]>;
};

/**
 * Repairs each saved loadout with core's `repairLoadout` (reference 08 "Saved to the profile"): a
 * slot naming content that no longer exists, or that its class may not take, gets the class's
 * auto-build. A class content does not have is ignored. Never throws.
 */
export function resolveSavedLoadouts(
  content: LoadoutContent,
  records: ReadonlyMap<string, SavedLoadout>,
): ResolvedLoadouts {
  const saved: Record<string, string> = {};
  const repairs = new Map<string, readonly LoadoutSlot[]>();
  for (const [classId, record] of records) {
    if (!content.legends.has(classId)) continue;
    const { loadout, repaired } = repairLoadout({ classId, ...record }, content);
    saved[classId] = loadout.primaryWeaponId;
    if (repaired.length > 0) repairs.set(classId, repaired);
  }
  return { saved, repairs };
}
