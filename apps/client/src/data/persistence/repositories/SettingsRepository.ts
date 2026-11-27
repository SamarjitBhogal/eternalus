import type { PersistedSettings } from '../dto/SettingsDto';
import {
  SETTINGS_GROUPS,
  settingsFromGroupDto,
  toSettingsGroupDto,
  validateSettingsGroupDto,
} from '../dto/SettingsDto';
import { QUARANTINE_STORE, SETTINGS_STORE } from '../schema/migrations';
import type { StorageAdapter } from '../StorageAdapter.types';
import { readOrQuarantine } from './readOrQuarantine';
import type { QuarantineReport, WarnReporter } from './readOrQuarantine.types';

/**
 * Reads and writes a profile's settings, one record per group keyed `[profileId, group]`
 * (architecture 14 §7). Every read goes through `readOrQuarantine`: a corrupt group is
 * quarantined alone and reported as missing, so the caller falls back to that group's defaults
 * and the other groups still load (architecture 14 §8).
 */
export class SettingsRepository {
  private readonly adapter: StorageAdapter;
  private readonly knownActions: ReadonlySet<string>;
  private readonly report: QuarantineReport;

  /** `now` is wall-clock milliseconds, used only to date quarantined records. */
  public constructor(
    adapter: StorageAdapter,
    knownActions: ReadonlySet<string>,
    now: () => number,
    warn: WarnReporter,
  ) {
    this.adapter = adapter;
    this.knownActions = knownActions;
    this.report = { now, warn };
  }

  /**
   * The saved groups of `profileId`. A group that is not saved, or was corrupt, is absent from
   * the result: use its default.
   */
  public load(profileId: string): Promise<Partial<PersistedSettings>> {
    return this.adapter.transaction(
      [SETTINGS_STORE, QUARANTINE_STORE],
      'readwrite',
      async (tx): Promise<Partial<PersistedSettings>> => {
        let loaded: Partial<PersistedSettings> = {};
        for (const group of SETTINGS_GROUPS) {
          const dto = await readOrQuarantine(
            tx,
            {
              store: SETTINGS_STORE,
              key: [profileId, group],
              validate: (raw) => validateSettingsGroupDto(group, raw, this.knownActions),
            },
            this.report,
          );
          if (dto !== null) {
            loaded = { ...loaded, ...settingsFromGroupDto(dto) };
          }
        }
        return loaded;
      },
    );
  }

  /** Replaces every saved group of `profileId`, in one transaction. */
  public save(profileId: string, settings: PersistedSettings): Promise<void> {
    return this.adapter.transaction([SETTINGS_STORE], 'readwrite', async (tx) => {
      for (const group of SETTINGS_GROUPS) {
        await tx.put(SETTINGS_STORE, toSettingsGroupDto(profileId, group, settings));
      }
    });
  }
}
