import { settingsSlice, type SettingsSliceState } from '../../bridge/slices/settingsSlice';
import { rebind, resetBindings } from '../input/bindingEdits';
import { withDefaults } from '../input/keybindings';
import type { SavedSettings, SettingsIntent } from './settingsState.types';

/**
 * The settings to start with: the saved ones with every missing binding defaulted, or all
 * defaults when nothing was saved (or the save was quarantined).
 */
export function settingsWithDefaults(saved: SavedSettings | null): SettingsSliceState {
  const defaults = settingsSlice.getInitialState();
  return {
    ...defaults,
    ...saved,
    bindings: withDefaults(saved?.bindings ?? []),
  };
}

/** The settings after one settings intent from the UI. */
export function applySettingsIntent(
  settings: SettingsSliceState,
  intent: SettingsIntent,
): SettingsSliceState {
  switch (intent.kind) {
    case 'update-binding':
      return {
        ...settings,
        bindings: rebind(settings.bindings, intent.action, intent.chord, intent.onConflict),
      };
    case 'reset-bindings':
      return { ...settings, bindings: resetBindings(settings.bindings, intent.action) };
    case 'update-settings':
      return {
        ...settings,
        audio: { ...settings.audio, ...intent.patch.audio },
        video: { ...settings.video, ...intent.patch.video },
        accessibility: { ...settings.accessibility, ...intent.patch.accessibility },
      };
  }
}
