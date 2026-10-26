/**
 * Test support for the HUD tests (OD-16: a helper file beside the tests it serves). Never imported
 * by a module `main.tsx` reaches.
 */
import type { Binding, HudSlotId, InputAction, InputChord } from '../../bridge/Binding.types';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import type { RootState } from '../../bridge/store';

/** A keyboard binding of `action` to `code`, shown as `label`. */
const key = (action: InputAction, code: string, label: string): Binding => ({
  action,
  chords: [{ device: 'keyboard', code, label }],
});

/** The HUD's default keys (game/input/keybindings.ts, which ui/ may not import): 1–4, Z, C, Esc. */
export const HUD_BINDINGS: readonly Binding[] = [
  key('ability-1', 'Digit1', '1'),
  key('ability-2', 'Digit2', '2'),
  key('ability-3', 'Digit3', '3'),
  key('ability-4', 'Digit4', '4'),
  key('gadget-1', 'KeyZ', 'Z'),
  key('gadget-2', 'KeyC', 'C'),
  key('pause-menu', 'Escape', 'Esc'),
];

/** `HUD_BINDINGS` with `slot` bound to `chord` instead. */
export function withBinding(slot: HudSlotId, chord: InputChord): readonly Binding[] {
  return HUD_BINDINGS.map((binding) =>
    binding.action === slot ? { action: slot, chords: [chord] } : binding,
  );
}

/** The fourth mouse button as a captured chord shows it (FR-080, 13 §8). */
export const MOUSE_4: InputChord = { device: 'mouse', code: '3', label: 'Mouse 4' };

/** The settings slice holding `bindings`. */
export const settingsWith = (bindings: readonly Binding[]): RootState['settings'] => ({
  ...settingsSlice.getInitialState(),
  bindings,
});

/** The match setup of the Figma HUD: a Light player who picked the Legionnaire (`warrior`). */
export const FIGMA_MATCH_SETUP: RootState['matchSetup'] = {
  ...matchSetupSlice.getInitialState(),
  playerTeam: 'light',
  selection: { classId: 'warrior', specId: null },
};

/**
 * `state` (the Figma HUD's `figmaHudState()`, which each test file imports from the bridge's HUD
 * fixture module itself, HC-F6) with the Figma's setup and the HUD's default keys.
 */
export function withHudSetup(state: Partial<RootState>): Partial<RootState> {
  return { ...state, matchSetup: FIGMA_MATCH_SETUP, settings: settingsWith(HUD_BINDINGS) };
}

/**
 * The declarations of the rule whose selector is exactly `selector` in a module's CSS text, with
 * every comment stripped.
 * @throws Error when no rule has that selector, so an assertion about a renamed rule fails instead
 *   of checking an empty string (a negative one would pass).
 */
export function cssRule(css: string, selector: string): string {
  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('}')
    .map((block) => block.split('{'))
    .find(([head]) => head?.trim() === selector)?.[1];
  if (declarations === undefined) throw new Error(`no rule with the selector "${selector}"`);
  return declarations;
}
