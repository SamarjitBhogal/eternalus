import { describe, expect, it } from 'vitest';

import { loadoutKey, validateSavedLoadoutDto } from './SavedLoadoutDto';

const VALID = {
  schemaVersion: 1,
  id: loadoutKey('local', 'knight'),
  profileId: 'local',
  specId: 'knight',
  name: null,
  updatedAt: 1_760_000_000_000,
  loadout: { primaryWeaponId: 'raptor-talons' },
};

describe('validateSavedLoadoutDto', () => {
  it('accepts a well-formed record', () => {
    expect(validateSavedLoadoutDto(VALID)).toEqual({ ok: true, dto: VALID });
  });

  it('accepts a named record', () => {
    const named = { ...VALID, name: 'Loadout 1' };
    expect(validateSavedLoadoutDto(named)).toEqual({ ok: true, dto: named });
  });

  it("accepts a weapon id content may no longer have: repairing it is the caller's call", () => {
    const renamed = { ...VALID, loadout: { primaryWeaponId: 'gone' } };
    expect(validateSavedLoadoutDto(renamed)).toEqual({ ok: true, dto: renamed });
  });

  it('keeps only the fields of the record, so nothing unchecked reaches the caller', () => {
    const extra = { ...VALID, classId: 'magus', loadout: { ...VALID.loadout, classId: 'magus' } };
    expect(validateSavedLoadoutDto(extra)).toEqual({ ok: true, dto: VALID });
  });

  it.each([
    ['a non-object', 'text', 'not an object'],
    ['an unknown version', { ...VALID, schemaVersion: 2 }, 'schemaVersion: unsupported version 2'],
    ['a missing profile', { ...VALID, profileId: 3 }, 'profileId: not a string'],
    ['a missing Legend', { ...VALID, specId: undefined }, 'specId: not a string'],
    [
      'a key that is not the profile and Legend',
      { ...VALID, id: 'x' },
      'id: does not match profileId and specId',
    ],
    [
      'a record keyed by class, as before DEC-354 (1)',
      { schemaVersion: 1, id: 'local/warrior', profileId: 'local', classId: 'warrior' },
      'specId: not a string',
    ],
    ['a name that is not text', { ...VALID, name: 7 }, 'name: not a string or null'],
    ['a missing name', { ...VALID, name: undefined }, 'name: not a string or null'],
    ['a missing time', { ...VALID, updatedAt: undefined }, 'updatedAt: not a time'],
    ['a time that is not finite', { ...VALID, updatedAt: Number.NaN }, 'updatedAt: not a time'],
    ['a time before 1970', { ...VALID, updatedAt: -1 }, 'updatedAt: not a time'],
    ['missing slots', { ...VALID, loadout: undefined }, 'loadout: not an object'],
    ['slots in a list', { ...VALID, loadout: ['x'] }, 'loadout: not an object'],
    [
      'a missing weapon',
      { ...VALID, loadout: { primaryWeaponId: 4 } },
      'loadout.primaryWeaponId: not a string',
    ],
    [
      'an empty weapon',
      { ...VALID, loadout: { primaryWeaponId: '' } },
      'loadout.primaryWeaponId: empty',
    ],
  ])('rejects %s and names the field', (_name, value, reason) => {
    expect(validateSavedLoadoutDto(value)).toEqual({ ok: false, reason });
  });

  it('refuses a flat record, as this branch saved before DEC-418 (1): it has no name or slots', () => {
    const flat = {
      schemaVersion: 1,
      id: loadoutKey('local', 'knight'),
      profileId: 'local',
      specId: 'knight',
      primaryWeaponId: 'raptor-talons',
    };
    expect(validateSavedLoadoutDto(flat)).toEqual({
      ok: false,
      reason: 'name: not a string or null',
    });
    expect(validateSavedLoadoutDto({ ...flat, name: null, updatedAt: 0 })).toEqual({
      ok: false,
      reason: 'loadout: not an object',
    });
  });

  it('builds one key per profile and Legend', () => {
    expect(loadoutKey('a', 'b')).not.toBe(loadoutKey('b', 'a'));
  });
});
