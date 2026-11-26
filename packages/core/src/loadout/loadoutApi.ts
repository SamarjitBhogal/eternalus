import { createDefaultLoadoutRules } from './defaultLoadoutRules';
import type { Loadout, LoadoutSlot } from './Loadout.types';
import { LoadoutValidator } from './LoadoutValidator';
import type { LoadoutContent, LoadoutProblem } from './LoadoutValidator.types';

const DEFAULT_VALIDATOR = new LoadoutValidator(createDefaultLoadoutRules());

/** The `Loadout` field each slot is stored in; a new slot is one more entry. */
const SLOT_FIELDS = {
  'primary-weapon': 'primaryWeaponId',
} as const satisfies Record<LoadoutSlot, Exclude<keyof Loadout, 'classId'>>;

/** Every slot, in `SLOT_FIELDS` order. */
const SLOTS = Object.keys(SLOT_FIELDS) as readonly LoadoutSlot[];

/**
 * Every problem of `loadout` against `content`, by the default rules (05 §12); empty when it is
 * valid. The one definition of "valid": `EntityFactory` runs it when a Legend spawns, and the
 * client's `LoadoutController` before it saves.
 */
export const validateLoadout = (
  loadout: Loadout,
  content: LoadoutContent,
): readonly LoadoutProblem[] => DEFAULT_VALIDATOR.validate(loadout, content);

/**
 * The class's default loadout, every slot filled from its `defaultLoadout` (reference 08
 * "auto-build"). Bots spawn with the same defaults, so the auto-build and the bots never disagree.
 *
 * @throws Error when `classId` names no class.
 */
export const autoBuildLoadout = (classId: string, content: LoadoutContent): Loadout => {
  if (!content.legends.has(classId)) {
    throw new Error(`autoBuildLoadout: class "${classId}" does not exist.`);
  }
  return { classId, primaryWeaponId: content.legends.get(classId).defaultLoadout.primaryWeaponId };
};

/**
 * `saved` with every slot that breaks a rule replaced by the auto-build's (reference 08: a saved
 * loadout naming content that no longer exists is repaired for the missing slot, never crashed
 * on), and the slots it replaced, as `LoadoutSlot`s (DEC-354 (3)).
 *
 * @throws Error when the class itself does not exist (nothing to auto-build from).
 */
export const repairLoadout = (
  saved: Loadout,
  content: LoadoutContent,
): { readonly loadout: Loadout; readonly repaired: readonly LoadoutSlot[] } => {
  const built = autoBuildLoadout(saved.classId, content);
  const problems = validateLoadout(saved, content);
  const repaired = SLOTS.filter((slot) => problems.some(({ field }) => field === slot));
  const loadout = repaired.reduce<Loadout>(
    (current, slot) => ({ ...current, [SLOT_FIELDS[slot]]: built[SLOT_FIELDS[slot]] }),
    saved,
  );
  return { loadout, repaired };
};
