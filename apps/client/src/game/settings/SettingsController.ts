import { makeLogRecord } from '@eternalus/core';

import type { Binding } from '../../bridge/Binding.types';
import type { UiIntent } from '../../bridge/events';
import type { SettingsSliceState } from '../../bridge/slices/settingsSlice';
import { ownPlatformChordsFirst } from '../input/bindingEdits';
import type { SettingsControllerDeps } from './SettingsController.types';
import { applySettingsIntent, settingsWithDefaults } from './settingsState';

/**
 * The one writer of settings and keybindings, in every session phase (menu and in-match pause).
 * Loads the saved settings at start, then turns each settings intent from the UI into new
 * settings, publishes them on the bus (the store and `InputMapper` follow) and saves them. The
 * published bindings list the platform's own modifier chords first (DEC-118).
 */
export class SettingsController {
  private readonly deps: SettingsControllerDeps;
  private settings: SettingsSliceState | null = null;
  private stopListening: (() => void) | null = null;

  /** Builds the controller; nothing happens until `start()`. */
  public constructor(deps: SettingsControllerDeps) {
    this.deps = deps;
  }

  /**
   * Loads the saved settings (defaults filled in), publishes them and starts handling intents.
   * If storage cannot be read, it logs a warning and starts from defaults; it never rejects.
   */
  public async start(): Promise<void> {
    const saved = await this.deps.persistence.loadSettings().catch((error: unknown) => {
      this.report('WARN', 'settings could not be loaded; using defaults', error);
      return null;
    });
    this.publish(settingsWithDefaults(saved));
    this.stopListening = this.deps.bus.on('ui-intent', this.onIntent);
  }

  /** The current bindings, or `null` before `start()` has published the settings. */
  public get bindings(): readonly Binding[] | null {
    return this.settings?.bindings ?? null;
  }

  /** Stops handling intents. */
  public destroy(): void {
    this.stopListening?.();
    this.stopListening = null;
  }

  private readonly onIntent = (intent: UiIntent): void => {
    const isSettingsIntent =
      intent.kind === 'update-binding' ||
      intent.kind === 'reset-bindings' ||
      intent.kind === 'update-settings';
    if (this.settings === null || !isSettingsIntent) {
      return;
    }
    const published = this.publish(applySettingsIntent(this.settings, intent));
    this.deps.persistence.saveSettings(published).catch((error: unknown) => {
      this.report('ERROR', 'settings could not be saved', error);
    });
  };

  private report(level: 'WARN' | 'ERROR', body: string, error: unknown): void {
    this.deps.logger.log(
      makeLogRecord(level, 'client.settings', body, { attributes: { error: String(error) } }),
    );
  }

  private publish(settings: SettingsSliceState): SettingsSliceState {
    const published = {
      ...settings,
      bindings: ownPlatformChordsFirst(settings.bindings, this.deps.isApplePlatform),
    };
    this.settings = published;
    this.deps.bus.emit('settings', published);
    return published;
  }
}
