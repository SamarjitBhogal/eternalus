import { describe, expect, it } from 'vitest';

import type { InputSnapshot } from '../engine/input/InputDevice.types';
import { BindingResolver } from './BindingResolver';
import { rebind } from './bindingEdits';
import { InputMapper } from './InputMapper';
import { PRESETS } from './keybindings';

function snapshotWith(keys: string[], mouseButtons: number[] = []): InputSnapshot {
  return { keys: new Set(keys), mouseButtons: new Set(mouseButtons), pointer: null };
}

function mapperFor(bindings = PRESETS.wasd): InputMapper {
  return new InputMapper(bindings, new BindingResolver());
}

describe('InputMapper', () => {
  it('moves up while W is held', () => {
    const mapper = mapperFor();

    const intent = mapper.toIntent(mapper.resolve(snapshotWith(['KeyW'])), null);

    expect(intent.move).toEqual({ x: 0, y: -1 });
  });

  it('normalises diagonal movement to length 1', () => {
    const mapper = mapperFor();

    const { move } = mapper.toIntent(mapper.resolve(snapshotWith(['KeyW', 'KeyD'])), null);

    expect(Math.hypot(move.x, move.y)).toBeCloseTo(1);
    expect(move.x).toBeCloseTo(Math.SQRT1_2);
    expect(move.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it('cancels opposite directions out', () => {
    const mapper = mapperFor();

    const intent = mapper.toIntent(mapper.resolve(snapshotWith(['KeyW', 'KeyS'])), null);

    expect(intent.move).toEqual({ x: 0, y: 0 });
  });

  it('reports a press once, then holds, then a release', () => {
    const mapper = mapperFor();

    const first = mapper.resolve(snapshotWith(['Digit1']));
    const second = mapper.resolve(snapshotWith(['Digit1']));
    const third = mapper.resolve(snapshotWith([]));

    expect([...first.pressed]).toEqual(['ability-1']);
    expect([...second.pressed]).toEqual([]);
    expect([...second.held]).toEqual(['ability-1']);
    expect([...third.released]).toEqual(['ability-1']);
  });

  it('casts only on the frame the slot is pressed', () => {
    const mapper = mapperFor();

    const pressed = mapper.toIntent(mapper.resolve(snapshotWith(['KeyZ'])), null);
    const held = mapper.toIntent(mapper.resolve(snapshotWith(['KeyZ'])), null);

    expect(pressed.cast).toBe('gadget-1');
    expect(held.cast).toBeNull();
  });

  it('attacks with the main mouse button and passes the aim through', () => {
    const mapper = mapperFor();

    const intent = mapper.toIntent(mapper.resolve(snapshotWith([], [0])), { x: 12, y: 34 });

    expect(intent.attack).toBe(true);
    expect(intent.aim).toEqual({ x: 12, y: 34 });
  });

  it('reports sprint while held and the turret and interact keys on press', () => {
    const mapper = mapperFor();

    const intent = mapper.toIntent(
      mapper.resolve(snapshotWith(['ShiftLeft', 'KeyE', 'KeyP', 'KeyT'])),
      null,
    );

    expect(intent).toMatchObject({
      isSprinting: true,
      interact: true,
      turretToggle: true,
      turretAmmo: true,
    });
  });

  it('follows a rebinding of W to ArrowUp with no code change', () => {
    const mapper = mapperFor();
    const upArrow = { device: 'keyboard', code: 'ArrowUp', label: '↑' } as const;

    mapper.setBindings(rebind(PRESETS.wasd, 'move-up', upArrow, 'swap'));

    expect(mapper.toIntent(mapper.resolve(snapshotWith(['ArrowUp'])), null).move).toEqual({
      x: 0,
      y: -1,
    });
    expect(mapper.resolve(snapshotWith(['KeyW'])).held.size).toBe(0);
  });

  it('fires a gadget from a mouse side button once it is bound there', () => {
    const sideButton = { device: 'mouse', code: '3', label: 'Mouse 4' } as const;
    const mapper = mapperFor(rebind(PRESETS.wasd, 'gadget-1', sideButton, 'swap'));

    const intent = mapper.toIntent(mapper.resolve(snapshotWith([], [3])), null);

    expect(intent.cast).toBe('gadget-1');
  });
});
