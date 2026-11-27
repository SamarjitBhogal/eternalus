import type { DtoCheck } from './DtoCheck.types';
import { isRecord } from './dtoCheck';

/**
 * What a saved loadout holds today: the primary weapon. Secondary weapon, passive, artifacts,
 * abilities and the ultimate join with the `Loadout` model of Phase 4 sprint 4.5. A weapon is a
 * plain id here: one content no longer has is repaired by core's `repairLoadout` after loading
 * (reference 08), not quarantined. The domain type of `PersistenceController`: `LoadoutRepository`
 * maps it to and from the stored `LoadoutDtoV1` (architecture 14 §2, §3).
 */
export type PersistedLoadout = {
  readonly primaryWeaponId: string;
};

/**
 * The stored slots of a saved loadout (architecture 14 §7 `LoadoutDtoV1`): the primary weapon
 * today. Each later slot lands as an optional field, which needs no `schemaVersion` bump
 * (DEC-125). It holds no class and no Legend (architecture 14 §14; `INBOX.md` asks the owner).
 */
type LoadoutDtoV1 = {
  readonly primaryWeaponId: string;
};

/**
 * The `loadouts` store record (architecture 14 §7, §8; DEC-418 (1)): one per profile and Legend
 * (DEC-354 (1)).
 */
export type SavedLoadoutDtoV1 = {
  readonly schemaVersion: 1;
  /** `loadoutKey(profileId, specId)`: the store's key, so a profile keeps one loadout per Legend. */
  readonly id: string;
  readonly profileId: string;
  /** The Legend (a `LegendSpecDefinition` id) this loadout is for. */
  readonly specId: string;
  /**
   * The loadout's name. Always `null` today: a profile keeps one loadout per Legend, and no design
   * names a loadout yet.
   */
  readonly name: string | null;
  /** When the loadout was last saved, in wall-clock milliseconds (14 §7: wall clock only here). */
  readonly updatedAt: number;
  readonly loadout: LoadoutDtoV1;
};

/** Separates the profile and Legend in `loadoutKey`; neither id may contain it. */
const KEY_SEPARATOR = '/';

/** The store key of the loadout `profileId` keeps for the Legend `specId`. */
export function loadoutKey(profileId: string, specId: string): string {
  return `${profileId}${KEY_SEPARATOR}${specId}`;
}

/** Checks the nested slots; the reason names the first bad field. */
function validateLoadoutDto(value: unknown): DtoCheck<LoadoutDtoV1> {
  if (!isRecord(value)) return { ok: false, reason: 'loadout: not an object' };
  const { primaryWeaponId } = value;
  if (typeof primaryWeaponId !== 'string') {
    return { ok: false, reason: 'loadout.primaryWeaponId: not a string' };
  }
  return primaryWeaponId === ''
    ? { ok: false, reason: 'loadout.primaryWeaponId: empty' }
    : { ok: true, dto: { primaryWeaponId } };
}

/**
 * Checks a stored loadout record's shape before anything trusts it (architecture 14 §8), and
 * returns a copy that holds only the record's own fields. The reason names the first bad field. A
 * flat record (the slots beside the header, as saved before DEC-418 (1)) fails, so the caller
 * quarantines it and uses the auto-build. Whether its ids still name content is the loadout rules'
 * call (`repairLoadout`), made by the caller.
 */
export function validateSavedLoadoutDto(value: unknown): DtoCheck<SavedLoadoutDtoV1> {
  if (!isRecord(value)) return { ok: false, reason: 'not an object' };
  const { schemaVersion, id, profileId, specId, name, updatedAt } = value;
  if (schemaVersion !== 1) {
    return { ok: false, reason: `schemaVersion: unsupported version ${String(schemaVersion)}` };
  }
  if (typeof profileId !== 'string') return { ok: false, reason: 'profileId: not a string' };
  if (typeof specId !== 'string') return { ok: false, reason: 'specId: not a string' };
  const key = loadoutKey(profileId, specId);
  if (id !== key) return { ok: false, reason: 'id: does not match profileId and specId' };
  if (name !== null && typeof name !== 'string') {
    return { ok: false, reason: 'name: not a string or null' };
  }
  // A wall-clock time: a finite number of milliseconds, not negative.
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt) || updatedAt < 0) {
    return { ok: false, reason: 'updatedAt: not a time' };
  }
  const loadout = validateLoadoutDto(value.loadout);
  if (!loadout.ok) return loadout;
  return {
    ok: true,
    dto: { schemaVersion, id: key, profileId, specId, name, updatedAt, loadout: loadout.dto },
  };
}
