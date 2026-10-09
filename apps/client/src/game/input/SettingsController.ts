import type { UiIntent } from '../../bridge/events';
import type { SettingsSliceState } from '../../bridge/slices/settingsSlice';
import type { SettingsControllerDeps } from './SettingsController.types';
import { applySettingsIntent, settingsWithDefaults } from './settingsState';

/**
 * The one writer of settings and keybindings, in every session phase (menu and in-match pause).
 * Loads the saved settings at start, then turns each settings intent from the UI into new
 * settings, publishes them on the bus (the store and `InputMapper` follow) and saves them.
 */
export class SettingsController {
  private readonly deps: SettingsControllerDeps;
  private settings: SettingsSliceState | null = null;
  private stopListening: (() => void) | null = null;

  /** Builds the controller; nothing happens until `start()`. */
  public constructor(deps: SettingsControllerDeps) {
    this.deps = deps;
  }

  /** Loads the saved settings (defaults filled in), publishes them and starts handling intents. */
  public async start(): Promise<void> {
    this.publish(settingsWithDefaults(await this.deps.persistence.loadSettings()));
    this.stopListening = this.deps.bus.on('ui-intent', this.onIntent);
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
    const next = applySettingsIntent(this.settings, intent);
    this.publish(next);
    // ponytail: a failed save surfaces as an unhandled rejection; route it to the Logger port
    // (core diagnostics, session B) with the "storage degraded" banner when IndexedDB lands.
    void this.deps.persistence.saveSettings(next);
  };

  private publish(settings: SettingsSliceState): void {
    this.settings = settings;
    this.deps.bus.emit('settings', settings);
  }
}
