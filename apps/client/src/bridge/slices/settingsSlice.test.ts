import { combineSlices } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import type { Binding } from '../Binding.types';
import { settingsSlice, type SettingsSliceState } from './settingsSlice';

const BINDINGS: readonly Binding[] = [
  { action: 'move-up', chords: [{ device: 'keyboard', code: 'KeyW', label: 'W' }] },
  { action: 'attack', chords: [{ device: 'mouse', code: '0', label: 'LMB' }] },
  { action: 'interact', chords: [] },
];

const reducer = combineSlices(settingsSlice);
const { selectBindingLabel, selectChordOwner, selectBindings } = settingsSlice.selectors;

function stateWith(bindings: readonly Binding[]): ReturnType<typeof reducer> {
  const settings: SettingsSliceState = { ...settingsSlice.getInitialState(), bindings };
  return reducer(undefined, settingsSlice.actions.settingsChanged(settings));
}

describe('settingsSlice', () => {
  it('starts with no bindings until the game publishes them', () => {
    expect(selectBindings(reducer(undefined, { type: 'init' }))).toEqual([]);
  });

  it('replaces the whole state when the game publishes new settings', () => {
    const state = stateWith(BINDINGS);

    expect(selectBindings(state)).toEqual(BINDINGS);
  });

  it('labels an action with its first chord, or null when it is unbound', () => {
    const state = stateWith(BINDINGS);

    expect(selectBindingLabel(state, 'move-up')).toBe('W');
    expect(selectBindingLabel(state, 'interact')).toBeNull();
    expect(selectBindingLabel(state, 'sprint')).toBeNull();
  });

  it('finds the action holding an input by device and code, ignoring the label', () => {
    const state = stateWith(BINDINGS);

    expect(selectChordOwner(state, { device: 'keyboard', code: 'KeyW', label: 'w' })).toBe(
      'move-up',
    );
    expect(selectChordOwner(state, { device: 'keyboard', code: '0', label: '0' })).toBeNull();
  });
});
