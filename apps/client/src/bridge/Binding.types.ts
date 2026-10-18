import type { AbilitySlot } from '@eternalus/core';

/**
 * Every player action that can be bound to a key or a button. Adding an action is one literal
 * here and one entry in `game/input/keybindings.ts` (its `DEFAULT_CHORDS` record demands it).
 * The types live in `bridge/` so `ui/` can name actions (`<KeyGlyph action="ability-1" />`)
 * without importing `game/`.
 */
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

/**
 * One physical input that triggers an action. Two chords are the same input when their `device`
 * and `code` match; `label` is only what the player sees.
 */
export type InputChord = {
  /** The hardware it comes from. Gamepad chords are post-MVP; the shape already allows them. */
  readonly device: 'keyboard' | 'mouse' | 'gamepad';
  /**
   * Keyboard: `KeyboardEvent.code` (`'KeyW'`), so bindings survive keyboard layouts. Mouse:
   * `MouseEvent.button` as a string (`'0'` main … `'3'`/`'4'` side buttons). Gamepad: the
   * standard-mapping button index as a string.
   */
  readonly code: string;
  /** The text a prompt shows: the key seen at bind time (`'W'`, `'↑'`) or a button name. */
  readonly label: string;
};

/**
 * The `InputAction`s that are also HUD slots (05 §15, 17 R21): core's `AbilitySlot` without
 * `default-action`, so `<KeyGlyph action={slot} />` needs no mapping table.
 */
export type HudSlotId = Extract<InputAction, Exclude<AbilitySlot, 'default-action'>>;

/** The chords bound to one action. Any chord of any device triggers it. */
export type Binding = { readonly action: InputAction; readonly chords: readonly InputChord[] };

/** The named sets of default bindings the game ships with. */
export type BindingPreset = 'wasd' | 'arrows';

/**
 * What happens to another action that already holds the chord being bound: `swap` gives it the
 * rebound action's previous chord, `replace` takes the chord away from it.
 */
export type BindingConflictPolicy = 'swap' | 'replace';
