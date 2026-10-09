import type { InputAction } from '../../bridge/Binding.types';

/** The settings screen's sections, in tab order. */
export const SETTINGS_TABS = ['controls', 'audio', 'video', 'accessibility'] as const;

/** One settings section. */
export type SettingsTab = (typeof SETTINGS_TABS)[number];

/** Labels and messages of the settings screen and its press-to-bind flow. */
export const SETTINGS_STRINGS = {
  title: 'Settings',
  tablist: 'Settings sections',
  tabs: {
    controls: 'Controls',
    audio: 'Audio',
    video: 'Video',
    accessibility: 'Accessibility',
  } satisfies Record<SettingsTab, string>,
  back: 'Back',
  rebindHint: 'Select to rebind',
  listening: 'Press a key or mouse button…',
  confirm: 'Enter to save, Esc to cancel',
  conflict: (chord: string, owner: string) => `${chord} is already bound to ${owner}.`,
  save: 'Save',
  swap: 'Swap',
  replace: 'Replace',
  cancel: 'Cancel',
  reset: 'Reset',
  resetLabel: (action: string) => `Reset ${action} to default`,
  resetAll: 'Reset all to defaults',
  unbound: '—',
  volume: { master: 'Master volume', music: 'Music volume', effects: 'Effects volume' },
  fullscreen: 'Fullscreen',
  renderScale: 'Render scale',
  reduceMotion: 'Reduce motion',
  colourBlindMode: 'Colour-blind mode',
} as const;

/** What the settings screen calls each action. A missing action is a compile error. */
export const ACTION_LABELS: Readonly<Record<InputAction, string>> = {
  'move-up': 'Move up',
  'move-down': 'Move down',
  'move-left': 'Move left',
  'move-right': 'Move right',
  attack: 'Attack',
  'ability-1': 'Ability 1',
  'ability-2': 'Ability 2',
  'ability-3': 'Ability 3',
  'ability-4': 'Ultimate',
  'gadget-1': 'Gadget 1',
  'gadget-2': 'Gadget 2',
  sprint: 'Sprint',
  interact: 'Interact',
  'turret-toggle-control': 'Turret: take or leave control',
  'turret-switch-ammo': 'Turret: switch ammo',
  'camera-zoom-in': 'Zoom in',
  'camera-zoom-out': 'Zoom out',
  'toggle-minimap': 'Toggle minimap',
  'pause-menu': 'Pause menu',
  'toggle-developer-menu': 'Developer menu',
  'toggle-perf-overlay': 'Performance overlay',
};

/** Names of `MouseEvent.button` 0–4 as a captured chord shows them. */
export const MOUSE_BUTTON_LABELS: readonly string[] = ['LMB', 'MMB', 'RMB', 'Mouse 4', 'Mouse 5'];

/** `KeyboardEvent.key` values whose label is not the key itself upper-cased. */
export const KEY_LABELS: Readonly<Record<string, string>> = {
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'Esc',
};
