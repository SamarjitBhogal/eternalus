import type { InputChord } from './Binding.types';

/**
 * The identity of a chord, ignoring its label: `'keyboard:KeyW'`, `'mouse:3'`, and with modifiers
 * `'keyboard:Control+Shift+F3'` (sorted, so their order does not matter). Two chords with the same
 * key are the same physical input, so binding both to different actions is a conflict.
 */
export function chordKey(chord: Pick<InputChord, 'device' | 'code' | 'modifiers'>): string {
  const modifiers = [...(chord.modifiers ?? [])].sort();
  return `${chord.device}:${[...modifiers, chord.code].join('+')}`;
}
