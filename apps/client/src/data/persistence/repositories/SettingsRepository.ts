import type { PersistedSettings, SettingsDtoV1 } from '../dto/SettingsDto';
import { validateSettingsDto } from '../dto/SettingsDto';
import { QUARANTINE_STORE, SETTINGS_STORE } from '../schema/migrations';
import type { StorageAdapter } from '../StorageAdapter.types';

/**
 * Reads and writes a profile's settings record. Every read is validated; a corrupt record is
 * moved to the quarantine store in the same unit of work and reported as missing, so the
 * caller falls back to defaults and no screen can crash on stored data.
 */
export class SettingsRepository {
  private readonly adapter: StorageAdapter;
  private readonly knownActions: ReadonlySet<string>;
  private readonly now: () => number;

  /** `now` is wall-clock milliseconds, used only to date quarantined records. */
  public constructor(
    adapter: StorageAdapter,
    knownActions: ReadonlySet<string>,
    now: () => number,
  ) {
    this.adapter = adapter;
    this.knownActions = knownActions;
    this.now = now;
  }

  /** The saved settings of `profileId`, or `null` when none are saved or they were corrupt. */
  public load(profileId: string): Promise<PersistedSettings | null> {
    return this.adapter.transaction(
      [SETTINGS_STORE, QUARANTINE_STORE],
      'readwrite',
      async (tx): Promise<PersistedSettings | null> => {
        const raw = await tx.get(SETTINGS_STORE, profileId);
        if (raw === undefined) {
          return null;
        }
        const checked = validateSettingsDto(raw, this.knownActions);
        if (checked.ok) {
          const { bindings, audio, video, accessibility } = checked.dto;
          return { bindings, audio, video, accessibility };
        }
        await tx.put(QUARANTINE_STORE, {
          store: SETTINGS_STORE,
          key: profileId,
          reason: checked.reason,
          quarantinedAt: this.now(),
          value: raw,
        });
        await tx.delete(SETTINGS_STORE, profileId);
        return null;
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
