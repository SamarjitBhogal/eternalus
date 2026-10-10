import type { PersistedSettings, SettingsDtoV1 } from '../dto/SettingsDto';
import { validateSettingsDto } from '../dto/SettingsDto';
import { QUARANTINE_STORE, SETTINGS_STORE } from '../schema/migrations';
import type { StorageAdapter } from '../StorageAdapter.types';
import { readOrQuarantine } from './readOrQuarantine';
import type { QuarantineReport, WarnReporter } from './readOrQuarantine.types';

/**
 * Reads and writes a profile's settings record. Every read goes through `readOrQuarantine`: a
 * corrupt record is quarantined and reported as missing, so the caller falls back to defaults
 * (architecture 14 §8).
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

  /** The saved settings of `profileId`, or `null` when none are saved or they were corrupt. */
  public load(profileId: string): Promise<PersistedSettings | null> {
    return this.adapter.transaction(
      [SETTINGS_STORE, QUARANTINE_STORE],
      'readwrite',
      async (tx): Promise<PersistedSettings | null> => {
        const dto = await readOrQuarantine(
          tx,
          {
            store: SETTINGS_STORE,
            key: profileId,
            validate: (raw) => validateSettingsDto(raw, this.knownActions),
          },
          this.report,
        );
        if (dto === null) {
          return null;
        }
        const { bindings, audio, video, accessibility } = dto;
        return { bindings, audio, video, accessibility };
      },
    );
  }

  /** Replaces the saved settings of `profileId`. */
  public save(profileId: string, settings: PersistedSettings): Promise<void> {
    const { bindings, audio, video, accessibility } = settings;
    const dto: SettingsDtoV1 = {
      schemaVersion: 1,
      profileId,
      bindings,
      audio,
      video,
      accessibility,
    };
    return this.adapter.transaction([SETTINGS_STORE], 'readwrite', (tx) =>
      tx.put(SETTINGS_STORE, dto),
    );
  }
}
