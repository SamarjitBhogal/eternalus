import type { PersistedLoadout } from './dto/LoadoutDto';
import type { PersistedSettings } from './dto/SettingsDto';
import { FallbackStorageAdapter } from './FallbackStorageAdapter';
import { LOCAL_PROFILE_ID } from './PersistenceController.constants';
import type { PersistenceControllerDeps } from './PersistenceController.types';
import { GuestRepository } from './repositories/GuestRepository';
import { LoadoutRepository } from './repositories/LoadoutRepository';
import { SettingsRepository } from './repositories/SettingsRepository';
import { STORAGE_SCHEMA } from './schema/migrations';
import type { StorageAdapter } from './StorageAdapter.types';

/**
 * The single entry point to everything the game saves (architecture 14 §2, rule 13). Callers
 * never see a transaction, a store name or a DTO. Settings, loadouts and the guest id for now;
 * profiles, match history and replays join as one repository each.
 */
export class PersistenceController {
  private readonly adapter: StorageAdapter;
  private readonly settings: SettingsRepository;
  private readonly loadouts: LoadoutRepository;
  private readonly guest: GuestRepository;

  /** Builds the facade over the injected adapter. Call `open()` before anything else. */
  public constructor(deps: PersistenceControllerDeps) {
    const { fallback, knownActions, now, warn } = deps;
    this.adapter =
      fallback === undefined ? deps.adapter : new FallbackStorageAdapter(deps.adapter, fallback);
    this.settings = new SettingsRepository(this.adapter, knownActions, now, warn);
    this.loadouts = new LoadoutRepository(this.adapter, now, warn);
    this.guest = new GuestRepository(this.adapter, { now, warn });
  }

  /**
   * Opens storage, migrating it to the current schema. With an injected `fallback`, a failure is
   * reported at ERROR and storage continues on the fallback (architecture 14 §10): nothing is
   * saved past the session.
   */
  public open(): Promise<void> {
    return this.adapter.open(STORAGE_SCHEMA);
  }

  /** The saved settings, or `null` when there are none (or they were corrupt): use defaults. */
  public loadSettings(): Promise<PersistedSettings | null> {
    return this.settings.load(LOCAL_PROFILE_ID);
  }

  /** Saves the settings, replacing the previous ones. */
  public saveSettings(settings: PersistedSettings): Promise<void> {
    return this.settings.save(LOCAL_PROFILE_ID, settings);
  }

  /**
   * The saved loadout of each named class. A class with nothing saved, or a corrupt record, is
   * absent from the map: use the class default.
   */
  public loadLoadouts(classIds: readonly string[]): Promise<ReadonlyMap<string, PersistedLoadout>> {
    return this.loadouts.loadAll(LOCAL_PROFILE_ID, classIds);
  }

  /** Saves the loadout of one class, replacing the previous one. */
  public saveLoadout(classId: string, loadout: PersistedLoadout): Promise<void> {
    return this.loadouts.save(LOCAL_PROFILE_ID, classId, loadout);
  }

  /** The guest id the Duel server issued, or `null` when none is saved (or it was corrupt). */
  public loadGuestId(): Promise<string | null> {
    return this.guest.load(LOCAL_PROFILE_ID);
  }

  /** Saves the guest id, replacing the previous one. */
  public saveGuestId(guestId: string): Promise<void> {
    return this.guest.save(LOCAL_PROFILE_ID, guestId);
  }

  /** Closes storage. */
  public close(): void {
    this.adapter.close();
  }
}
