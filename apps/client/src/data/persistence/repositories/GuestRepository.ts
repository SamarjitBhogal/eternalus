import { validateGuestDto, type GuestDtoV1 } from '../dto/GuestDto';
import { GUEST_STORE, QUARANTINE_STORE } from '../schema/migrations';
import type { StorageAdapter } from '../StorageAdapter.types';
import { readOrQuarantine } from './readOrQuarantine';
import type { QuarantineReport } from './readOrQuarantine.types';

/** Reads and writes a profile's guest id; a corrupt record is quarantined and read as missing. */
export class GuestRepository {
  public constructor(
    private readonly adapter: StorageAdapter,
    private readonly report: QuarantineReport,
  ) {}

  /** The saved guest id of `profileId`, or `null` when none is saved or it was corrupt. */
  public load(profileId: string): Promise<string | null> {
    return this.adapter.transaction(
      [GUEST_STORE, QUARANTINE_STORE],
      'readwrite',
      async (tx): Promise<string | null> => {
        const dto = await readOrQuarantine(
          tx,
          { store: GUEST_STORE, key: profileId, validate: validateGuestDto },
          this.report,
        );
        return dto?.guestId ?? null;
      },
    );
  }

  /** Replaces the saved guest id of `profileId`. */
  public save(profileId: string, guestId: string): Promise<void> {
    const dto: GuestDtoV1 = { schemaVersion: 1, profileId, guestId };
    return this.adapter.transaction([GUEST_STORE], 'readwrite', (tx) => tx.put(GUEST_STORE, dto));
  }
}
