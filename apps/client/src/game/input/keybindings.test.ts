import { afterEach, describe, expect, it, vi } from 'vitest';

import { BindingResolver } from './BindingResolver';
import { DEFAULT_CHORDS, INPUT_ACTIONS, PRESETS, withDefaults } from './keybindings';

describe('keybindings', () => {
  it('gives every action at least one default chord', () => {
    const unbound = INPUT_ACTIONS.filter((action) => DEFAULT_CHORDS[action].length === 0);

    expect(unbound).toEqual([]);
  });

  it.each(['wasd', 'arrows'] as const)('binds no input twice in the %s preset', (preset) => {
    const resolver = new BindingResolver();
    resolver.setBindings(PRESETS[preset]);

    expect(resolver.conflicts()).toEqual([]);
  });

  it('lists every action once in each preset, in INPUT_ACTIONS order', () => {
    expect(PRESETS.wasd.map((binding) => binding.action)).toEqual(INPUT_ACTIONS);
    expect(PRESETS.arrows.map((binding) => binding.action)).toEqual(INPUT_ACTIONS);
  });

  it('opens View Details with V by default (DEC-103)', () => {
    expect(DEFAULT_CHORDS['view-details']).toEqual([
      { device: 'keyboard', code: 'KeyV', label: 'V' },
    ]);
  });

  it('shows the developer camera tools with Ctrl+Shift+F3 and Cmd+Shift+F3 by default (DEC-105)', () => {
    expect(DEFAULT_CHORDS['toggle-developer-camera']).toEqual(
      expect.arrayContaining([
        { device: 'keyboard', code: 'F3', label: 'Ctrl+Shift+F3', modifiers: ['Control', 'Shift'] },
        { device: 'keyboard', code: 'F3', label: 'Cmd+Shift+F3', modifiers: ['Meta', 'Shift'] },
      ]),
    );
    expect(DEFAULT_CHORDS['toggle-developer-camera']).toHaveLength(2);
  });

  it('moves with the arrow keys in the arrows preset and keeps the other defaults', () => {
    const arrows = new Map(PRESETS.arrows.map((binding) => [binding.action, binding.chords]));

    expect(arrows.get('move-up')).toEqual([{ device: 'keyboard', code: 'ArrowUp', label: '↑' }]);
    expect(arrows.get('ability-1')).toEqual(DEFAULT_CHORDS['ability-1']);
  });

  it('fills actions missing from a save with defaults and drops unknown ones', () => {
    const upArrow = { device: 'keyboard', code: 'ArrowUp', label: '↑' } as const;

    const bindings = withDefaults([
      { action: 'move-up', chords: [upArrow] },
      { action: 'fly', chords: [upArrow] }, // not an action (anymore)
    ]);

    expect(bindings).toHaveLength(INPUT_ACTIONS.length);
    expect(bindings.find((binding) => binding.action === 'move-up')?.chords).toEqual([upArrow]);
    expect(bindings.find((binding) => binding.action === 'move-down')?.chords).toEqual(
      DEFAULT_CHORDS['move-down'],
    );
  });
});

describe('the developer camera chords on each platform (DEC-118)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it.each([
    ['a Mac', 'Macintosh; Intel Mac OS X 10_15_7', ['Cmd+Shift+F3', 'Ctrl+Shift+F3']],
    ['an iPad', 'iPad; CPU OS 17_0 like Mac OS X', ['Cmd+Shift+F3', 'Ctrl+Shift+F3']],
    ['Windows', 'Windows NT 10.0; Win64; x64', ['Ctrl+Shift+F3', 'Cmd+Shift+F3']],
    ['Linux', 'X11; Linux x86_64', ['Ctrl+Shift+F3', 'Cmd+Shift+F3']],
  ])('lists the chord of %s first', async (_platform, system, labels) => {
    vi.stubGlobal('navigator', { userAgent: `Mozilla/5.0 (${system})` });
    vi.resetModules();
    const { DEFAULT_CHORDS: chords } = await import('./keybindings');

    expect(chords['toggle-developer-camera'].map((chord) => chord.label)).toEqual(labels);
  });
});
