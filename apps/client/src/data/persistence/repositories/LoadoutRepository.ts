import type { PersistedLoadout, SavedLoadoutDtoV1 } from '../dto/SavedLoadoutDto';
import { loadoutKey, validateSavedLoadoutDto } from '../dto/SavedLoadoutDto';
import { LOADOUT_STORE, QUARANTINE_STORE } from '../schema/migrations';
import type { StorageAdapter, StorageTx } from '../StorageAdapter.types';
import { readOrQuarantine } from './readOrQuarantine';
import type { QuarantineReport, WarnReporter } from './readOrQuarantine.types';

/**
 * Reads and writes the loadout a profile keeps for each Legend (`specId`, DEC-354 (1)) as a
 * `SavedLoadoutDtoV1` (architecture 14 §7, DEC-418 (1)). Callers pass and get a
 * `PersistedLoadout`, mapped from and to the record's `loadout` here (14 §3). Every read goes
 * through `readOrQuarantine`: a corrupt record (a flat one saved before DEC-418 (1) included) is
 * quarantined and reported as missing, so the caller falls back to the auto-build (architecture 14
 * §8). A well-formed record naming a weapon content no longer has is returned as it is:
 * `LoadoutController` repairs it with core's `repairLoadout`.
 */
export class LoadoutRepository {
  private readonly adapter: StorageAdapter;
  private readonly now: () => number;
  private readonly report: QuarantineReport;

  /**
   * `now` is wall-clock milliseconds: it dates each saved loadout (`updatedAt`) and each
   * quarantined record.
   */
  public constructor(adapter: StorageAdapter, now: () => number, warn: WarnReporter) {
    this.adapter = adapter;
    this.now = now;
    this.report = { now, warn };
  }

  /** The loadout `profileId` saved for `specId`, or `null` when none is saved or it was corrupt. */
  public load(profileId: string, specId: string): Promise<PersistedLoadout | null> {
    return this.adapter.transaction([LOADOUT_STORE, QUARANTINE_STORE], 'readwrite', (tx) =>
      this.read(tx, profileId, specId),
    );
  }

  /**
   * The saved loadout of each Legend in `specIds`, keyed by spec id. A Legend with no saved (or a
   * corrupt) loadout is absent. The storage port has no scan, so the caller names the Legends.
   */
  public loadAll(
    profileId: string,
    specIds: readonly string[],
  ): Promise<ReadonlyMap<string, PersistedLoadout>> {
    return this.adapter.transaction([LOADOUT_STORE, QUARANTINE_STORE], 'readwrite', async (tx) => {
      const saved = new Map<string, PersistedLoadout>();
      for (const specId of specIds) {
        const loadout = await this.read(tx, profileId, specId);
        if (loadout !== null) {
          saved.set(specId, loadout);
        }
      }
      return saved;
    });
  }

  /**
   * Replaces the loadout `profileId` keeps for `specId`, dated now. The record has no name: a
   * profile keeps one loadout per Legend.
   */
  public save(profileId: string, specId: string, loadout: PersistedLoadout): Promise<void> {
    const dto: SavedLoadoutDtoV1 = {
      schemaVersion: 1,
      id: loadoutKey(profileId, specId),
      profileId,
      specId,
      name: null,
      updatedAt: this.now(),
      loadout: { primaryWeaponId: loadout.primaryWeaponId },
    };
    return this.adapter.transaction([LOADOUT_STORE], 'readwrite', (tx) =>
      tx.put(LOADOUT_STORE, dto),
    );
  }

  private async read(
    tx: StorageTx,
    profileId: string,
    specId: string,
  ): Promise<PersistedLoadout | null> {
    const dto = await readOrQuarantine(
      tx,
      {
        store: LOADOUT_STORE,
        key: loadoutKey(profileId, specId),
        validate: (raw) => validateSavedLoadoutDto(raw),
      },
      this.report,
    );
    return dto === null ? null : { primaryWeaponId: dto.loadout.primaryWeaponId };
  }
}
