import type { PersistedLoadout } from './dto/LoadoutDto';
import type { PersistedSettings } from './dto/SettingsDto';
import { LOCAL_PROFILE_ID } from './PersistenceController.constants';
import type { PersistenceControllerDeps } from './PersistenceController.types';
import { LoadoutRepository } from './repositories/LoadoutRepository';
import { SettingsRepository } from './repositories/SettingsRepository';
import { STORAGE_SCHEMA } from './schema/migrations';
import type { StorageAdapter } from './StorageAdapter.types';
import { StorageError } from './StorageError';

/**
 * The single entry point to everything the game saves (architecture 14 §2, rule 13). Callers
 * never see a transaction, a store name or a DTO. Settings and loadouts for now; profiles, match
 * history and replays join as one repository each.
 */
export class PersistenceController {
  private readonly deps: PersistenceControllerDeps;
  private adapter: StorageAdapter;
  private settings: SettingsRepository;
  private loadouts: LoadoutRepository;

  /** Builds the facade over the injected adapter. Call `open()` before anything else. */
  public constructor(deps: PersistenceControllerDeps) {
    this.deps = deps;
    this.adapter = deps.adapter;
    this.settings = new SettingsRepository(deps.adapter, deps.knownActions, deps.now, deps.warn);
    this.loadouts = new LoadoutRepository(deps.adapter, deps.now, deps.warn);
  }

  /**
   * Opens storage, migrating it to the current schema. If it fails and a `fallback` was
   * injected, warns and continues on the fallback (architecture 14 §10): nothing is saved past
   * the session.
   */
  public async open(): Promise<void> {
    try {
      await this.adapter.open(STORAGE_SCHEMA);
    } catch (error: unknown) {
      if (this.deps.fallback === undefined) {
        throw error;
      }
      this.deps.warn('storage unavailable, falling back to memory: progress will not be saved', {
        kind: error instanceof StorageError ? error.kind : 'unknown',
        error: String(error),
      });
      this.useAdapter(this.deps.fallback());
      await this.adapter.open(STORAGE_SCHEMA);
    }
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

  /** Closes storage. */
  public close(): void {
    this.adapter.close();
  }

  private useAdapter(adapter: StorageAdapter): void {
    const { knownActions, now, warn } = this.deps;
    this.adapter = adapter;
    this.settings = new SettingsRepository(adapter, knownActions, now, warn);
    this.loadouts = new LoadoutRepository(adapter, now, warn);
  }
}
