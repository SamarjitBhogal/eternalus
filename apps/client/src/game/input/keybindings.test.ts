import { describe, expect, it } from 'vitest';

import { INPUT_ACTIONS } from '../../bridge/Binding.types';
import { DEFAULT_CHORDS, PRESETS } from './keybindings';

const keyboardCodes = (preset: keyof typeof PRESETS): string[] =>
  PRESETS[preset].flatMap(({ chords }) =>
    chords.flatMap((chord) => (chord.device === 'keyboard' ? [chord.code] : [])),
  );

describe('keybindings', () => {
  it('gives every action at least one default chord', () => {
    expect(INPUT_ACTIONS.filter((action) => DEFAULT_CHORDS[action].length === 0)).toEqual([]);
  });

  it.each(['wasd', 'arrows'] as const)('binds each action once in the %s preset', (preset) => {
    expect(PRESETS[preset].map(({ action }) => action)).toEqual([...INPUT_ACTIONS]);
  });

  it.each(['wasd', 'arrows'] as const)('uses no key twice in the %s preset', (preset) => {
    const codes = keyboardCodes(preset);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('moves with WASD by default and with the arrows in the arrows preset', () => {
    const moveUp = (preset: keyof typeof PRESETS) =>
      PRESETS[preset].find(({ action }) => action === 'move-up')?.chords;

    expect(moveUp('wasd')).toEqual([{ device: 'keyboard', code: 'KeyW', label: 'W' }]);
    expect(moveUp('arrows')).toEqual([{ device: 'keyboard', code: 'ArrowUp', label: '↑' }]);
  });
});
