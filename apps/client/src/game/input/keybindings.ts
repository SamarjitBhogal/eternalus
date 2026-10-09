import {
  type Binding,
  INPUT_ACTIONS,
  type InputAction,
  type InputChord,
} from '../../bridge/Binding.types';

const key = (code: string, label: string): InputChord => ({ device: 'keyboard', code, label });

/**
 * The default chord of every action: the ONLY place a default key is written (architecture 13
 * §6.1, game design 09). A missing action is a compile error. TUNE: the `Recommendation:` keys.
 */
export const DEFAULT_CHORDS: Readonly<Record<InputAction, readonly InputChord[]>> = {
  'move-up': [key('KeyW', 'W')],
  'move-down': [key('KeyS', 'S')],
  'move-left': [key('KeyA', 'A')],
  'move-right': [key('KeyD', 'D')],
  attack: [{ device: 'mouse', button: 0 }],
  'ability-1': [key('Digit1', '1')],
  'ability-2': [key('Digit2', '2')],
  'ability-3': [key('Digit3', '3')],
  'ability-4': [key('Digit4', '4')], // 4 = the ultimate (game doc)
  'gadget-1': [key('KeyZ', 'Z')],
  'gadget-2': [key('KeyC', 'C')],
  sprint: [key('ShiftLeft', 'Shift')],
  interact: [key('KeyE', 'E')],
  'turret-toggle-control': [key('KeyP', 'P')],
  'turret-switch-ammo': [key('KeyT', 'T')],
  'camera-zoom-in': [key('Equal', '=')],
  'camera-zoom-out': [key('Minus', '-')],
  'toggle-minimap': [key('KeyM', 'M')],
  'pause-menu': [key('Escape', 'Esc')],
  'toggle-developer-menu': [key('Backquote', '`')],
  'toggle-perf-overlay': [key('F9', 'F9')],
};

/** Movement on the arrow keys instead of WASD; every other action keeps its default. */
const ARROW_MOVES: Partial<Record<InputAction, readonly InputChord[]>> = {
  'move-up': [key('ArrowUp', '↑')],
  'move-down': [key('ArrowDown', '↓')],
  'move-left': [key('ArrowLeft', '←')],
  'move-right': [key('ArrowRight', '→')],
};

const toBindings = (overrides: Partial<Record<InputAction, readonly InputChord[]>>): Binding[] =>
  INPUT_ACTIONS.map((action) => ({ action, chords: overrides[action] ?? DEFAULT_CHORDS[action] }));

/** The binding presets the settings screen offers (architecture 13 §6.1). */
export const PRESETS: Readonly<Record<'wasd' | 'arrows', readonly Binding[]>> = {
  wasd: toBindings({}),
  arrows: toBindings(ARROW_MOVES),
};
