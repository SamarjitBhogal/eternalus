import type { BindingConflictPolicy, InputAction, InputChord } from '../../bridge/Binding.types';
import type { SettingsPatch, SettingsSliceState } from '../../bridge/slices/settingsSlice';
import type { SavedBinding } from './keybindings';

/**
 * The UI intents that change settings.
 * TODO(sam): replace with the matching members of `UiIntent` (bridge/events.ts) once session D
 * has added `onConflict`, the per-action reset and `update-settings` there (INBOX request).
 */
export type SettingsIntent =
  | {
      readonly kind: 'update-binding';
      readonly action: InputAction;
      readonly chord: InputChord;
      readonly onConflict: BindingConflictPolicy;
    }
  | { readonly kind: 'reset-bindings'; readonly action: InputAction | null }
  | { readonly kind: 'update-settings'; readonly patch: SettingsPatch };

/** Settings as storage returns them: bindings still carry plain-string actions. */
export type SavedSettings = Omit<SettingsSliceState, 'bindings'> & {
  readonly bindings: readonly SavedBinding[];
};
