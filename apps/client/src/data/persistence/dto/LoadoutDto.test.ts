import { describe, expect, it } from 'vitest';

import { loadoutKey, validateLoadoutDto } from './LoadoutDto';

const VALID = {
  schemaVersion: 1,
  id: loadoutKey('local', 'warrior'),
  profileId: 'local',
  classId: 'warrior',
  primaryWeaponId: 'raptor-talons',
};

describe('validateLoadoutDto', () => {
  it('accepts a well-formed record', () => {
    expect(validateLoadoutDto(VALID)).toEqual({ ok: true, dto: VALID });
  });

  it("accepts a weapon id content may no longer have: repairing it is the caller's call", () => {
    const renamed = { ...VALID, primaryWeaponId: 'gone' };
    expect(validateLoadoutDto(renamed)).toEqual({ ok: true, dto: renamed });
  });

  it.each([
    ['a non-object', 'text', 'not an object'],
    ['an unknown version', { ...VALID, schemaVersion: 2 }, 'schemaVersion: unsupported version 2'],
    ['a missing profile', { ...VALID, profileId: 3 }, 'profileId: not a string'],
    ['a missing class', { ...VALID, classId: undefined }, 'classId: not a string'],
    [
      'a key that is not the profile and class',
      { ...VALID, id: 'x' },
      'id: does not match profileId and classId',
    ],
    ['a missing weapon', { ...VALID, primaryWeaponId: 4 }, 'primaryWeaponId: not a string'],
    ['an empty weapon', { ...VALID, primaryWeaponId: '' }, 'primaryWeaponId: empty'],
  ])('rejects %s and names the field', (_name, value, reason) => {
    expect(validateLoadoutDto(value)).toEqual({ ok: false, reason });
  });

  it('builds one key per profile and class', () => {
    expect(loadoutKey('a', 'b')).not.toBe(loadoutKey('b', 'a'));
  });
});
