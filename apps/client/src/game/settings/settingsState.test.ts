import { describe, expect, it } from 'vitest';

import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { DEFAULT_CHORDS, PRESETS } from '../input/keybindings';
import { applySettingsIntent, settingsWithDefaults } from './settingsState';

const UP_ARROW = { device: 'keyboard', code: 'ArrowUp', label: '↑' } as const;

describe('settingsWithDefaults', () => {
  it('starts from every default when nothing was saved', () => {
    const settings = settingsWithDefaults(null);

    expect(settings).toEqual({ ...settingsSlice.getInitialState(), bindings: PRESETS.wasd });
  });

  it('keeps saved values and fills in bindings the save does not have', () => {
    const defaults = settingsSlice.getInitialState();
    const settings = settingsWithDefaults({
      ...defaults,
      audio: { master: 0.2, music: 0, effects: 1 },
      bindings: [{ action: 'move-up', chords: [UP_ARROW] }],
    });

    expect(settings.audio).toEqual({ master: 0.2, music: 0, effects: 1 });
    expect(settings.bindings.find((binding) => binding.action === 'move-up')?.chords).toEqual([
      UP_ARROW,
    ]);
    expect(settings.bindings.find((binding) => binding.action === 'move-down')?.chords).toEqual(
      DEFAULT_CHORDS['move-down'],
    );
  });
});

describe('applySettingsIntent', () => {
  const start = settingsWithDefaults(null);

  it('rebinds one action', () => {
    const next = applySettingsIntent(start, {
      kind: 'update-binding',
      action: 'move-up',
      chord: UP_ARROW,
      onConflict: 'swap',
    });

    expect(next.bindings.find((binding) => binding.action === 'move-up')?.chords).toEqual([
      UP_ARROW,
    ]);
  });

  it('resets one action or all of them', () => {
    const moved = applySettingsIntent(start, {
      kind: 'update-binding',
      action: 'move-up',
      chord: UP_ARROW,
      onConflict: 'swap',
    });

    expect(applySettingsIntent(moved, { kind: 'reset-bindings', action: 'move-up' })).toEqual(
      start,
    );
    expect(applySettingsIntent(moved, { kind: 'reset-bindings', action: null })).toEqual(start);
  });

  it('merges a patch into the groups it names and leaves the rest alone', () => {
    const next = applySettingsIntent(start, {
      kind: 'update-settings',
      patch: { audio: { music: 0.25 }, accessibility: { reduceMotion: true } },
    });

    expect(next.audio).toEqual({ ...start.audio, music: 0.25 });
    expect(next.accessibility).toEqual({ ...start.accessibility, reduceMotion: true });
    expect(next.video).toEqual(start.video);
    expect(next.bindings).toBe(start.bindings);
  });
});
