/**
 * Keybinding type contracts (architecture 13 §6.1). They live in `bridge/` because `ui/` needs
 * `InputAction` for `<KeyGlyph action>` and may not import `game/`. Default chords live in
 * `game/input/keybindings.ts`, never here.
 */

/** Every rebindable player or client action. Adding one is one literal here plus its default chords. */
export type InputAction =
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'attack'
  | 'ability-1'
  | 'ability-2'
  | 'ability-3'
  | 'ability-4'
  | 'gadget-1'
  | 'gadget-2'
  | 'sprint'
  | 'interact'
  | 'turret-toggle-control'
  | 'turret-switch-ammo'
  | 'camera-zoom-in'
  | 'camera-zoom-out'
  | 'toggle-minimap'
  | 'pause-menu'
  | 'toggle-developer-menu'
  | 'toggle-perf-overlay';

// Session F owns the shapes below; they are stated here, as in F's brief, only because the §2.3
// contract's `update-binding` intent and `settingsSlice.bindings` need them to compile.
/** One physical input that can trigger an action. */
export type InputChord = {
  readonly device: 'keyboard' | 'mouse' | 'gamepad';
  readonly code: string;
  readonly label: string;
};

/** The chords bound to one action. */
export type Binding = { readonly action: InputAction; readonly chords: readonly InputChord[] };
