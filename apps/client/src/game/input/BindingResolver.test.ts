import { describe, expect, it } from 'vitest';

import { chordKey } from '../../bridge/chordKey';
import { BindingResolver } from './BindingResolver';

describe('BindingResolver', () => {
  it('finds the action a chord is bound to', () => {
    const resolver = new BindingResolver();
    resolver.setBindings([
      { action: 'move-up', chords: [{ device: 'keyboard', code: 'KeyW', label: 'W' }] },
    ]);

    expect(resolver.actionsFor({ device: 'keyboard', code: 'KeyW' })).toEqual(['move-up']);
    expect(resolver.actionsFor({ device: 'keyboard', code: 'KeyQ' })).toEqual([]);
  });

  it('tells devices apart: mouse button 0 is not the key "0"', () => {
    const resolver = new BindingResolver();
    resolver.setBindings([
      { action: 'attack', chords: [{ device: 'mouse', code: '0', label: 'LMB' }] },
    ]);

    expect(resolver.actionsFor({ device: 'keyboard', code: '0' })).toEqual([]);
    expect(resolver.actionsFor({ device: 'mouse', code: '0' })).toEqual(['attack']);
  });

  it('tells a modifier chord apart from its plain key, whatever order its modifiers come in', () => {
    const resolver = new BindingResolver();
    resolver.setBindings([
      {
        action: 'toggle-developer-camera',
        chords: [{ device: 'keyboard', code: 'F3', label: 'F3', modifiers: ['Shift', 'Control'] }],
      },
    ]);

    expect(resolver.actionsFor({ device: 'keyboard', code: 'F3' })).toEqual([]);
    expect(
      resolver.actionsFor({ device: 'keyboard', code: 'F3', modifiers: ['Control', 'Shift'] }),
    ).toEqual(['toggle-developer-camera']);
  });

  it('reports an input bound to two actions as a conflict', () => {
    const keyW = { device: 'keyboard', code: 'KeyW', label: 'W' } as const;
    const resolver = new BindingResolver();
    resolver.setBindings([
      { action: 'move-up', chords: [keyW] },
      { action: 'interact', chords: [keyW] },
    ]);

    expect(resolver.conflicts()).toEqual([
      { chord: chordKey(keyW), actions: ['move-up', 'interact'] },
    ]);
  });

  it('forgets the old bindings when given new ones', () => {
    const resolver = new BindingResolver();
    resolver.setBindings([
      { action: 'move-up', chords: [{ device: 'keyboard', code: 'KeyW', label: 'W' }] },
    ]);

    resolver.setBindings([
      { action: 'move-up', chords: [{ device: 'keyboard', code: 'ArrowUp', label: '↑' }] },
    ]);

    expect(resolver.actionsFor({ device: 'keyboard', code: 'KeyW' })).toEqual([]);
  });
});
