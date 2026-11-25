import { describe, expect, it } from 'vitest';

import type { GuestDtoV1 } from './GuestDto';
import { validateGuestDto } from './GuestDto';

const VALID: GuestDtoV1 = {
  schemaVersion: 1,
  profileId: 'local',
  guestId: '00000000-0000-4000-8000-000000000001',
};

describe('validateGuestDto', () => {
  it('accepts a well-formed record', () => {
    expect(validateGuestDto(VALID)).toEqual({ ok: true, dto: VALID });
  });

  it('accepts an id of the longest allowed length', () => {
    const record = { ...VALID, guestId: 'g'.repeat(64) };
    expect(validateGuestDto(record)).toEqual({ ok: true, dto: record });
  });

  it.each([
    ['a non-object', 'guest', 'not an object'],
    ['a future version', { ...VALID, schemaVersion: 2 }, 'bad header'],
    ['a profile id that is not a string', { ...VALID, profileId: 7 }, 'bad header'],
    ['a guest id that is not a string', { ...VALID, guestId: 7 }, 'bad guest id'],
    ['an empty guest id', { ...VALID, guestId: '' }, 'bad guest id'],
    ['an over-long guest id', { ...VALID, guestId: 'g'.repeat(65) }, 'bad guest id'],
  ])('rejects %s', (_name, value, reason) => {
    expect(validateGuestDto(value)).toEqual({ ok: false, reason });
  });

  it('keeps only the known fields', () => {
    expect(validateGuestDto({ ...VALID, extra: true })).toEqual({ ok: true, dto: VALID });
  });
});
