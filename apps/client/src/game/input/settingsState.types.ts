import type { UiIntent } from '../../bridge/events';
import type { SettingsSliceState } from '../../bridge/slices/settingsSlice';
import type { SavedBinding } from './keybindings';

/** The UI intents that change settings. */
export type SettingsIntent = Extract<
  UiIntent,
  { readonly kind: 'update-binding' | 'reset-bindings' | 'update-settings' }
>;

/** Settings as storage returns them: bindings still carry plain-string actions. */
export type SavedSettings = Omit<SettingsSliceState, 'bindings'> & {
  readonly bindings: readonly SavedBinding[];
};
