import type { DtoCheck } from './DtoCheck.types';
import { isRecord } from './isRecord';

/** The longest guest id a record may hold (the server's ids are 36 characters). */
const MAX_GUEST_ID_LENGTH = 64;

/** The `guest` store record, one per profile: the id the Duel server issued. */
export type GuestDtoV1 = {
  readonly schemaVersion: 1;
  readonly profileId: string;
  readonly guestId: string;
};

/** Checks an untrusted stored value; the server judges the id itself, so only its type is checked. */
export function validateGuestDto(value: unknown): DtoCheck<GuestDtoV1> {
  if (!isRecord(value)) return { ok: false, reason: 'not an object' };
  const { schemaVersion, profileId, guestId } = value;
  if (schemaVersion !== 1 || typeof profileId !== 'string') {
    return { ok: false, reason: 'bad header' };
  }
  if (typeof guestId !== 'string' || guestId.length === 0 || guestId.length > MAX_GUEST_ID_LENGTH) {
    return { ok: false, reason: 'bad guest id' };
  }
  return { ok: true, dto: { schemaVersion, profileId, guestId } };
}
