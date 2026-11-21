import type { DtoCheck } from './DtoCheck.types';

/**
 * What a saved loadout holds today: the primary weapon. Secondary weapon, passive, artifacts,
 * abilities and the ultimate join with the `Loadout` model of Phase 4 sprint 4.5; each lands as an
 * optional field, which needs no `schemaVersion` bump (DEC-125). A weapon is a plain id here: one
 * content no longer has is repaired by core's `repairLoadout` after loading (reference 08), not
 * quarantined.
 */
export type PersistedLoadout = {
  readonly primaryWeaponId: string;
};

/** The `loadouts` store record: one per profile and class (architecture 14 §7). */
export type LoadoutDtoV1 = PersistedLoadout & {
  readonly schemaVersion: 1;
  /** `loadoutKey(profileId, classId)`: the store's key, so a profile keeps one loadout per class. */
  readonly id: string;
  readonly profileId: string;
  readonly classId: string;
};

/** Separates the profile and class in `loadoutKey`; neither id may contain it. */
const KEY_SEPARATOR = '/';

/** The store key of the loadout `profileId` keeps for `classId`. */
export function loadoutKey(profileId: string, classId: string): string {
  return `${profileId}${KEY_SEPARATOR}${classId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function loadoutProblem(value: unknown): string | null {
  if (!isRecord(value)) {
    return 'not an object';
  }
  if (value.schemaVersion !== 1) {
    return `schemaVersion: unsupported version ${String(value.schemaVersion)}`;
  }
  if (typeof value.profileId !== 'string') {
    return 'profileId: not a string';
  }
  if (typeof value.classId !== 'string') {
    return 'classId: not a string';
  }
  if (value.id !== loadoutKey(value.profileId, value.classId)) {
    return 'id: does not match profileId and classId';
  }
  if (typeof value.primaryWeaponId !== 'string') {
    return 'primaryWeaponId: not a string';
  }
  return value.primaryWeaponId === '' ? 'primaryWeaponId: empty' : null;
}

/**
 * Checks a stored loadout record's shape before anything trusts it (architecture 14 §8). The
 * reason names the first bad field. Whether its ids still name content is the loadout rules'
 * call (`repairLoadout`), made by the caller.
 */
export function validateLoadoutDto(value: unknown): DtoCheck<LoadoutDtoV1> {
  const reason = loadoutProblem(value);
  // Every field of LoadoutDtoV1 was checked above.
  return reason === null ? { ok: true, dto: value as LoadoutDtoV1 } : { ok: false, reason };
}
