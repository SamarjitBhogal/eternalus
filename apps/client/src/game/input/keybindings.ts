import type {
  Binding,
  BindingPreset,
  ChordModifier,
  InputAction,
  InputChord,
} from '../../bridge/Binding.types';

function key(code: string, label: string): InputChord {
  return { device: 'keyboard', code, label };
}

/** Whether the page runs on an Apple device, where Cmd (Meta) takes the place of Ctrl. */
const IS_APPLE_PLATFORM = /Mac|iPhone|iPad/.test(globalThis.navigator.userAgent);

/**
 * `chords` with this platform's own modifier chords first: Cmd (Meta) chords on an Apple device,
 * Ctrl chords elsewhere (DEC-118). The settings screen and the prompts show the first chord first.
 */
function platformChordsFirst(chords: readonly InputChord[]): readonly InputChord[] {
  const own: ChordModifier = IS_APPLE_PLATFORM ? 'Meta' : 'Control';
  const isOwn = (chord: InputChord): boolean => chord.modifiers?.includes(own) === true;
  return [...chords].sort((a, b) => Number(isOwn(b)) - Number(isOwn(a)));
}

/**
 * The default chords of every action: the only place in the codebase a default key is written
 * (docs/reference/game-design/09-controls.md, architecture 13 §6.1). The record type makes a
 * missing action a compile error.
 */
export const DEFAULT_CHORDS: Readonly<Record<InputAction, readonly InputChord[]>> = {
  'move-up': [key('KeyW', 'W')],
  'move-down': [key('KeyS', 'S')],
  'move-left': [key('KeyA', 'A')],
  'move-right': [key('KeyD', 'D')],
  attack: [{ device: 'mouse', code: '0', label: 'LMB' }],
  'ability-1': [key('Digit1', '1')],
  'ability-2': [key('Digit2', '2')],
  'ability-3': [key('Digit3', '3')],
  'ability-4': [key('Digit4', '4')], // the ultimate
  'gadget-1': [key('KeyZ', 'Z')],
  'gadget-2': [key('KeyC', 'C')],
  sprint: [key('ShiftLeft', 'Shift')], // Recommendation (09-controls)
  interact: [key('KeyE', 'E')], // Recommendation (09-controls)
  'turret-toggle-control': [key('KeyP', 'P')],
  'turret-switch-ammo': [key('KeyT', 'T')],
  'camera-zoom-in': [key('Equal', '=')],
  'camera-zoom-out': [key('Minus', '-')],
  'toggle-minimap': [key('KeyM', 'M')],
  'pause-menu': [key('Escape', 'Esc')],
  // DEC-103: V opens View Details on the selection steps (it replaces HC-F7's reused C there).
  'view-details': [key('KeyV', 'V')],
  'toggle-developer-menu': [key('F1', 'F1')],
  'toggle-perf-overlay': [key('F9', 'F9')],
  // DEC-105: Ctrl+Shift+F3 on Windows and Linux, Cmd+Shift+F3 on a Mac (Cmd+F3 is the Mac's Show
  // Desktop). DEC-118: both chords on every platform, this platform's own chord listed first.
  'toggle-developer-camera': platformChordsFirst([
    { device: 'keyboard', code: 'F3', label: 'Ctrl+Shift+F3', modifiers: ['Control', 'Shift'] },
    { device: 'keyboard', code: 'F3', label: 'Cmd+Shift+F3', modifiers: ['Meta', 'Shift'] },
  ]),
};

/** Every action, in the order the settings screen lists them. */
// Object.keys loses the key type; DEFAULT_CHORDS is typed as a full InputAction record.
export const INPUT_ACTIONS = Object.keys(DEFAULT_CHORDS) as readonly InputAction[];

/** A binding as it comes back from storage: the action is only a string until it is checked. */
export type SavedBinding = { readonly action: string; readonly chords: readonly InputChord[] };

/**
 * Every action with its saved chords, or its default chords when `saved` has none for it.
 * Unknown actions in `saved` are dropped, so the result is always one binding per action.
 */
export function withDefaults(saved: readonly SavedBinding[]): Binding[] {
  const chordsByAction = new Map(saved.map((binding) => [binding.action, binding.chords]));
  return INPUT_ACTIONS.map((action) => ({
    action,
    chords: chordsByAction.get(action) ?? DEFAULT_CHORDS[action],
  }));
}

const ARROW_MOVES: readonly SavedBinding[] = [
  { action: 'move-up', chords: [key('ArrowUp', '↑')] },
  { action: 'move-down', chords: [key('ArrowDown', '↓')] },
  { action: 'move-left', chords: [key('ArrowLeft', '←')] },
  { action: 'move-right', chords: [key('ArrowRight', '→')] },
];

/** The shipped binding sets: `wasd` is the default, `arrows` moves with the arrow keys. */
export const PRESETS: Readonly<Record<BindingPreset, readonly Binding[]>> = {
  wasd: withDefaults([]),
  arrows: withDefaults(ARROW_MOVES),
};
