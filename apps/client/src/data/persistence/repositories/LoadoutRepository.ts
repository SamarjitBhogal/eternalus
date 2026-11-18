import type { LoadoutDtoV1, PersistedLoadout } from '../dto/LoadoutDto';
import { loadoutKey, validateLoadoutDto } from '../dto/LoadoutDto';
import { LOADOUT_STORE, QUARANTINE_STORE } from '../schema/migrations';
import type { StorageAdapter, StorageTx } from '../StorageAdapter.types';
import { readOrQuarantine } from './readOrQuarantine';
import type { QuarantineReport, WarnReporter } from './readOrQuarantine.types';

/**
 * Reads and writes the loadout a profile keeps for each class. Every read goes through
 * `readOrQuarantine`: a corrupt record, or one naming a weapon that no longer exists, is
 * quarantined and reported as missing, so the caller falls back to the class default
 * (architecture 14 §8).
 */
export class LoadoutRepository {
  private readonly adapter: StorageAdapter;
  private readonly knownWeapons: ReadonlySet<string>;
  private readonly report: QuarantineReport;

  /** `now` is wall-clock milliseconds, used only to date quarantined records. */
  public constructor(
    adapter: StorageAdapter,
    knownWeapons: ReadonlySet<string>,
    now: () => number,
    warn: WarnReporter,
  ) {
    this.adapter = adapter;
    this.knownWeapons = knownWeapons;
    this.report = { now, warn };
  }

  /** The loadout `profileId` saved for `classId`, or `null` when none is saved or it was corrupt. */
  public load(profileId: string, classId: string): Promise<PersistedLoadout | null> {
    return this.adapter.transaction([LOADOUT_STORE, QUARANTINE_STORE], 'readwrite', (tx) =>
      this.read(tx, profileId, classId),
    );
  }

  /**
   * The saved loadout of each class in `classIds`, keyed by class id. A class with no saved (or a
   * corrupt) loadout is absent. The storage port has no scan, so the caller names the classes.
   */
  public loadAll(
    profileId: string,
    classIds: readonly string[],
  ): Promise<ReadonlyMap<string, PersistedLoadout>> {
    return this.adapter.transaction([LOADOUT_STORE, QUARANTINE_STORE], 'readwrite', async (tx) => {
      const saved = new Map<string, PersistedLoadout>();
      for (const classId of classIds) {
        const loadout = await this.read(tx, profileId, classId);
        if (loadout !== null) {
          saved.set(classId, loadout);
        }
      }
      return saved;
    });
  }

  /** Replaces the loadout `profileId` keeps for `classId`. */
  public save(profileId: string, classId: string, loadout: PersistedLoadout): Promise<void> {
    const dto: LoadoutDtoV1 = {
      schemaVersion: 1,
      id: loadoutKey(profileId, classId),
      profileId,
      classId,
      primaryWeaponId: loadout.primaryWeaponId,
    };
    return this.adapter.transaction([LOADOUT_STORE], 'readwrite', (tx) =>
      tx.put(LOADOUT_STORE, dto),
    );
  }

  private async read(
    tx: StorageTx,
    profileId: string,
    classId: string,
  ): Promise<PersistedLoadout | null> {
    const dto = await readOrQuarantine(
      tx,
      {
        store: LOADOUT_STORE,
        key: loadoutKey(profileId, classId),
        validate: (raw) => validateLoadoutDto(raw, this.knownWeapons),
      },
      this.report,
    );
    return dto === null ? null : { primaryWeaponId: dto.primaryWeaponId };
  }
}
