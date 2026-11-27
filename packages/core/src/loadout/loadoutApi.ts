import { createDefaultLoadoutRules } from './defaultLoadoutRules';
import type { Loadout, LoadoutSlot } from './Loadout.types';
import { LoadoutValidator } from './LoadoutValidator';
import type { LoadoutContent, LoadoutProblem } from './LoadoutValidator.types';

const DEFAULT_VALIDATOR = new LoadoutValidator(createDefaultLoadoutRules());

/** The `Loadout` field each slot is stored in; a new slot is one more entry. */
const SLOT_FIELDS = {
  'primary-weapon': 'primaryWeaponId',
} as const satisfies Record<LoadoutSlot, Exclude<keyof Loadout, 'classId' | 'specId'>>;

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
 * The class's default loadout, which no Legend owns (`specId: null`): every slot filled from the
 * class's `defaultLoadout` (reference 08 "auto-build"). A bot spawns with this, because core's bot
 * roster slot carries no Legend yet (05 §18). Core-internal: `index.ts` does not export it,
 * because the client builds loadouts per Legend with `autoBuildLoadout`.
 *
 * @throws Error when `classId` names no class.
 */
export const classDefaultLoadout = (classId: string, content: LoadoutContent): Loadout => {
  if (!content.legends.has(classId)) {
    throw new Error(`classDefaultLoadout: class "${classId}" does not exist.`);
  }
  const { primaryWeaponId } = content.legends.get(classId).defaultLoadout;
  return { classId, specId: null, primaryWeaponId };
};

/**
 * The Legend's default loadout (reference 08 "auto-build"). It starts from the Legend (05 §12,
 * DEC-354 (1)): core finds the Legend's class in content, and fills every slot from that class's
 * `defaultLoadout`. Bots spawn with the same class defaults, so the auto-build and the bots never
 * disagree.
 *
 * @throws Error when `specId` names no Legend, or the Legend's class does not exist.
 */
export const autoBuildLoadout = (specId: string, content: LoadoutContent): Loadout => {
  if (!content.specs.has(specId)) {
    throw new Error(`autoBuildLoadout: Legend "${specId}" does not exist.`);
  }
  return { ...classDefaultLoadout(content.specs.get(specId).classId, content), specId };
};

/**
 * `saved` with every slot that breaks a rule replaced by the auto-build's (reference 08: a saved
 * loadout naming content that no longer exists is repaired for the missing slot, never crashed
 * on), and the slots it replaced, as `LoadoutSlot`s (DEC-354 (3)).
 *
 * The replacement comes from the Legend's auto-build, or from the class default when `saved` has
 * no Legend. A class that does not match the Legend is not a slot, so it is not repaired:
 * `validateLoadout` still reports it.
 *
 * @throws Error when the Legend (or, with no Legend, the class) does not exist: there is nothing
 *   to auto-build from.
 */
export const repairLoadout = (
  saved: Loadout,
  content: LoadoutContent,
): { readonly loadout: Loadout; readonly repaired: readonly LoadoutSlot[] } => {
  const built =
    saved.specId === null
      ? classDefaultLoadout(saved.classId, content)
      : autoBuildLoadout(saved.specId, content);
  const problems = validateLoadout(saved, content);
  const repaired = SLOTS.filter((slot) => problems.some(({ field }) => field === slot));
  const loadout = repaired.reduce<Loadout>(
    (current, slot) => ({ ...current, [SLOT_FIELDS[slot]]: built[SLOT_FIELDS[slot]] }),
    saved,
  );
  return { loadout, repaired };
};
