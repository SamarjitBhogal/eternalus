/**
 * Keybinding type contracts (architecture 13 §6.1). They live in `bridge/` because `ui/` needs
 * `InputAction` for `<KeyGlyph action>` and may not import `game/`. Default chords live in
 * `game/input/keybindings.ts`, never here.
 */

/** Every rebindable player or client action. Adding one is one literal here plus its default chords. */
export const INPUT_ACTIONS = [
  'move-up',
  'move-down',
  'move-left',
  'move-right',
  'attack',
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
  'sprint',
  'interact',
  'turret-toggle-control',
  'turret-switch-ammo',
  'camera-zoom-in',
  'camera-zoom-out',
  'toggle-minimap',
  'pause-menu',
  'toggle-developer-menu',
  'toggle-perf-overlay',
] as const;

/** One rebindable player or client action. */
export type InputAction = (typeof INPUT_ACTIONS)[number];

/** One physical input that can trigger an action (architecture 09 §3, 13 §6.1). */
export type InputChord =
  | {
      readonly device: 'keyboard';
      /** `KeyboardEvent.code`: the physical key, the same on every layout. */
      readonly code: string;
      /** The key's label as seen when it was bound (`KeyboardEvent.key`), for prompts. */
      readonly label: string;
      readonly modifiers?: readonly string[];
    }
  | { readonly device: 'mouse'; readonly button: 0 | 1 | 2 | 3 | 4 }
  | { readonly device: 'gamepad'; readonly button: number }
  | {
      readonly device: 'gamepad-axis';
      readonly axis: number;
      readonly sign: -1 | 1;
      readonly deadzone: number;
    };

/** The chords bound to one action; the action is active when any of them is. */
export type Binding = { readonly action: InputAction; readonly chords: readonly InputChord[] };
