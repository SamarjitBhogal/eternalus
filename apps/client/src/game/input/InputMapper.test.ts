import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import type { InputSnapshot } from '../engine/input/InputDevice.types';
import { InputMapper } from './InputMapper';
import { PRESETS } from './keybindings';

const holding = (...keys: string[]): InputSnapshot => ({
  keys: new Set(keys),
  keyLabels: new Map(),
});

const intentOf = (mapper: InputMapper, ...keys: string[]) =>
  mapper.toIntent(mapper.resolve(holding(...keys)));

describe('InputMapper', () => {
  it('turns W held into a move straight up, (0, -1)', () => {
    expect(intentOf(new InputMapper(PRESETS.wasd), 'KeyW').move).toEqual({ x: 0, y: -1 });
  });

  it('stops moving when the key is released', () => {
    const mapper = new InputMapper(PRESETS.wasd);
    intentOf(mapper, 'KeyW');

    expect(intentOf(mapper).move).toEqual({ x: 0, y: 0 });
  });

  it('normalises a diagonal so it is not faster than a straight line', () => {
    const { move } = intentOf(new InputMapper(PRESETS.wasd), 'KeyW', 'KeyD');

    expect(move.x).toBeCloseTo(Math.SQRT1_2);
    expect(move.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it('stands still when opposite keys cancel out', () => {
    expect(intentOf(new InputMapper(PRESETS.wasd), 'KeyA', 'KeyD').move).toEqual({ x: 0, y: 0 });
  });

  it('follows a rebinding with no code change: W → ArrowUp', () => {
    const rebound: Binding[] = PRESETS.wasd.map((binding) =>
      binding.action === 'move-up'
        ? { action: 'move-up', chords: [{ device: 'keyboard', code: 'ArrowUp', label: '↑' }] }
        : binding,
    );
    const mapper = new InputMapper(PRESETS.wasd);
    mapper.setBindings(rebound);

    expect(intentOf(mapper, 'KeyW').move).toEqual({ x: 0, y: 0 });
    expect(intentOf(mapper, 'ArrowUp').move).toEqual({ x: 0, y: -1 });
    expect([mapper.isBound('KeyW'), mapper.isBound('ArrowUp')]).toEqual([false, true]);
  });

  it('reports the frame an action starts and the frame it ends', () => {
    const mapper = new InputMapper(PRESETS.wasd);

    const down = mapper.resolve(holding('KeyW'));
    const still = mapper.resolve(holding('KeyW'));
    const up = mapper.resolve(holding());

    expect([...down.pressed]).toEqual(['move-up']);
    expect([still.pressed.size, still.released.size, still.held.size]).toEqual([0, 0, 1]);
    expect([...up.released]).toEqual(['move-up']);
  });

  it('triggers an ability slot only on the frame its key goes down', () => {
    const mapper = new InputMapper(PRESETS.wasd);

    expect(intentOf(mapper, 'Digit4', 'KeyZ').triggered).toEqual(['ability-4', 'gadget-1']);
    expect(intentOf(mapper, 'Digit4', 'KeyZ').triggered).toEqual([]);
  });

  it('activates every action bound to one key', () => {
    const shared: Binding[] = [
      { action: 'move-up', chords: [{ device: 'keyboard', code: 'KeyW', label: 'W' }] },
      { action: 'sprint', chords: [{ device: 'keyboard', code: 'KeyW', label: 'W' }] },
    ];

    expect([...new InputMapper(shared).resolve(holding('KeyW')).held]).toEqual([
      'move-up',
      'sprint',
    ]);
  });
});
