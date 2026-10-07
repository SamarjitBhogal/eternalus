import { describe, expect, it } from 'vitest';

import type { Binding, InputAction, InputChord } from '../../bridge/Binding.types';
import { rebind, resetBindings } from './bindingEdits';
import { DEFAULT_CHORDS, PRESETS } from './keybindings';

const UP_ARROW: InputChord = { device: 'keyboard', code: 'ArrowUp', label: '↑' };
const KEY_S: InputChord = { device: 'keyboard', code: 'KeyS', label: 'S' };
const MOUSE_4: InputChord = { device: 'mouse', code: '3', label: 'Mouse 4' };

function chordsOf(bindings: readonly Binding[], action: InputAction): readonly InputChord[] {
  return bindings.find((binding) => binding.action === action)?.chords ?? [];
}

describe('rebind', () => {
  it('makes the new chord the only chord of the action', () => {
    const next = rebind(PRESETS.wasd, 'move-up', UP_ARROW, 'swap');

    expect(chordsOf(next, 'move-up')).toEqual([UP_ARROW]);
  });

  it('binds a mouse side button to a gadget (the requirements doc Z → side button case)', () => {
    const next = rebind(PRESETS.wasd, 'gadget-1', MOUSE_4, 'swap');

    expect(chordsOf(next, 'gadget-1')).toEqual([MOUSE_4]);
  });

  it('gives the other action the old chord when swapping a conflict', () => {
    // S already moves down: binding it to move-up hands W to move-down.
    const next = rebind(PRESETS.wasd, 'move-up', KEY_S, 'swap');

    expect(chordsOf(next, 'move-up')).toEqual([KEY_S]);
    expect(chordsOf(next, 'move-down')).toEqual(DEFAULT_CHORDS['move-up']);
  });

  it('leaves the other action without the input when replacing a conflict', () => {
    const next = rebind(PRESETS.wasd, 'move-up', KEY_S, 'replace');

    expect(chordsOf(next, 'move-up')).toEqual([KEY_S]);
    expect(chordsOf(next, 'move-down')).toEqual([]);
  });

  it('matches a conflict by device and code, not by label', () => {
    const relabelled = { ...KEY_S, label: 's' };

    const next = rebind(PRESETS.wasd, 'move-up', relabelled, 'replace');

    expect(chordsOf(next, 'move-down')).toEqual([]);
  });

  it('does not change the bindings it was given', () => {
    const before = structuredClone(PRESETS.wasd);

    rebind(PRESETS.wasd, 'move-up', KEY_S, 'swap');

    expect(PRESETS.wasd).toEqual(before);
  });
});

describe('resetBindings', () => {
  it('restores one action and takes its default input away from whoever held it', () => {
    // W was moved to move-down; resetting move-up claims W back.
    const moved = rebind(
      rebind(PRESETS.wasd, 'move-up', UP_ARROW, 'swap'),
      'move-down',
      DEFAULT_CHORDS['move-up'][0] ?? UP_ARROW,
      'replace',
    );

    const next = resetBindings(moved, 'move-up');

    expect(chordsOf(next, 'move-up')).toEqual(DEFAULT_CHORDS['move-up']);
    expect(chordsOf(next, 'move-down')).toEqual([]);
  });

  it('restores every action when no action is given', () => {
    const moved = rebind(PRESETS.wasd, 'move-up', UP_ARROW, 'swap');

    expect(resetBindings(moved, null)).toEqual(PRESETS.wasd);
  });
});
