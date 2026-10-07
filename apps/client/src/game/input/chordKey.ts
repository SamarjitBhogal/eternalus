import type { InputChord } from '../../bridge/Binding.types';

/**
 * The identity of a chord, ignoring its label: `'keyboard:KeyW'`, `'mouse:3'`. Two chords with
 * the same key are the same physical input, so binding both to different actions is a conflict.
 */
export function chordKey(chord: Pick<InputChord, 'device' | 'code'>): string {
  return `${chord.device}:${chord.code}`;
}
