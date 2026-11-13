import { GuestRepository } from './repositories/GuestRepository';
import type { PersistedSettings } from './dto/SettingsDto';
import { LOCAL_PROFILE_ID } from './PersistenceController.constants';
import type { PersistenceControllerDeps } from './PersistenceController.types';
import { SettingsRepository } from './repositories/SettingsRepository';
import { STORAGE_SCHEMA } from './schema/migrations';
import type { StorageAdapter } from './StorageAdapter.types';

/**
 * The single entry point to everything the game saves (architecture 14 §2, rule 13). Callers
 * never see a transaction, a store name or a DTO. Settings and the guest id for now; loadouts, profiles,
 * match history and replays join as one repository each.
 */
export class PersistenceController {
  private readonly adapter: StorageAdapter;
  private readonly settings: SettingsRepository;
  private readonly guest: GuestRepository;

  /** Builds the facade over the injected adapter. Call `open()` before anything else. */
  public constructor(deps: PersistenceControllerDeps) {
    this.adapter = deps.adapter;
    this.settings = new SettingsRepository(deps.adapter, deps.knownActions, deps.now, deps.warn);
    this.guest = new GuestRepository(deps.adapter, { now: deps.now, warn: deps.warn });
  }

  /** Opens storage, migrating it to the current schema. */
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
