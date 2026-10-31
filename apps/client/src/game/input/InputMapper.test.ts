import { describe, expect, it } from 'vitest';

import type { InputSnapshot, ScreenPoint } from '../engine/input/InputDevice.types';
import type { Projection } from '../engine/input/Projection.types';
import { rebind } from './bindingEdits';
import { InputMapper } from './InputMapper';
import { PRESETS } from './keybindings';

// A camera stand-in: the world is the canvas scaled by 2.
const PROJECTION: Projection = { screenToWorld: ({ x, y }) => ({ x: x * 2, y: y * 2 }) };

function snapshotWith(
  keys: string[],
  mouseButtons: number[] = [],
  pointer: ScreenPoint | null = null,
): InputSnapshot {
  return { keys: new Set(keys), mouseButtons: new Set(mouseButtons), pointer };
}

function intentFor(
  mapper: InputMapper,
  snapshot: InputSnapshot,
): ReturnType<InputMapper['toIntent']> {
  return mapper.toIntent(mapper.resolve(snapshot), PROJECTION);
}

describe('InputMapper', () => {
  it('moves up while W is held', () => {
    expect(intentFor(new InputMapper(PRESETS.wasd), snapshotWith(['KeyW'])).move).toEqual({
      x: 0,
      y: -1,
    });
  });

  it('normalises diagonal movement to length 1', () => {
    const { move } = intentFor(new InputMapper(PRESETS.wasd), snapshotWith(['KeyW', 'KeyD']));

    expect(Math.hypot(move.x, move.y)).toBeCloseTo(1);
    expect(move.x).toBeCloseTo(Math.SQRT1_2);
    expect(move.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it('cancels opposite directions out', () => {
    expect(intentFor(new InputMapper(PRESETS.wasd), snapshotWith(['KeyW', 'KeyS'])).move).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('reports a press once, then holds, then a release', () => {
    const mapper = new InputMapper(PRESETS.wasd);

    const first = mapper.resolve(snapshotWith(['Digit1']));
    const second = mapper.resolve(snapshotWith(['Digit1']));
    const third = mapper.resolve(snapshotWith([]));

    expect([...first.pressed]).toEqual(['ability-1']);
    expect([...second.pressed]).toEqual([]);
    expect([...second.held]).toEqual(['ability-1']);
    expect([...third.released]).toEqual(['ability-1']);
  });

  it('triggers a slot only on the frame it is pressed', () => {
    const mapper = new InputMapper(PRESETS.wasd);

    const pressed = intentFor(mapper, snapshotWith(['KeyZ', 'Digit2']));
    const held = intentFor(mapper, snapshotWith(['KeyZ', 'Digit2']));

    expect(pressed.triggered).toEqual(['ability-2', 'gadget-1']);
    expect(held.triggered).toEqual([]);
  });

  it('projects the pointer into the world as the aim, or none without a pointer', () => {
    const mapper = new InputMapper(PRESETS.wasd);

    expect(intentFor(mapper, snapshotWith([], [], { x: 6, y: 17 })).aim).toEqual({ x: 12, y: 34 });
    expect(intentFor(mapper, snapshotWith([])).aim).toBeNull();
  });

  it('keeps client-only and non-slot actions in the action state for the match to read', () => {
    const actions = new InputMapper(PRESETS.wasd).resolve(
      snapshotWith(['ShiftLeft', 'Escape'], [0]),
    );

    expect([...actions.pressed].sort()).toEqual(['attack', 'pause-menu', 'sprint']);
  });

  it('matches a modifier chord only with exactly its modifiers held (DEC-105)', () => {
    const mapper = new InputMapper(PRESETS.wasd);
    const press = (
      held: Partial<Record<'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey', boolean>>,
    ): boolean =>
      mapper.isActionKey('toggle-developer-camera', {
        code: 'F3',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        ...held,
      });

    expect(press({ ctrlKey: true, shiftKey: true })).toBe(true);
    expect(press({ metaKey: true, shiftKey: true })).toBe(true);
    expect(press({})).toBe(false);
    expect(press({ ctrlKey: true })).toBe(false);
    expect(press({ ctrlKey: true, shiftKey: true, altKey: true })).toBe(false);
    expect(press({ ctrlKey: true, metaKey: true, shiftKey: true })).toBe(false);
  });

  it('never holds a modifier chord as gameplay input: F3 held with Ctrl and Shift is no action', () => {
    const actions = new InputMapper(PRESETS.wasd).resolve(
      snapshotWith(['ControlLeft', 'ShiftLeft', 'F3']),
    );

    expect([...actions.held]).toEqual(['sprint']);
    expect(new InputMapper(PRESETS.wasd).isBound('F3')).toBe(false);
  });

  it('says which key codes are bound, so devices prevent defaults only for those', () => {
    const mapper = new InputMapper(PRESETS.wasd);

    expect(mapper.isBound('KeyW')).toBe(true);
    expect(mapper.isBound('KeyQ')).toBe(false);
  });

  it('follows a rebinding of W to ArrowUp with no code change', () => {
    const mapper = new InputMapper(PRESETS.wasd);
    const upArrow = { device: 'keyboard', code: 'ArrowUp', label: '↑' } as const;

    mapper.setBindings(rebind(PRESETS.wasd, 'move-up', upArrow, 'swap'));

    expect(intentFor(mapper, snapshotWith(['ArrowUp'])).move).toEqual({ x: 0, y: -1 });
    expect(mapper.resolve(snapshotWith(['KeyW'])).held.size).toBe(0);
    expect(mapper.isBound('KeyW')).toBe(false);
  });

  it('fires a gadget from a mouse side button once it is bound there', () => {
    const sideButton = { device: 'mouse', code: '3', label: 'Mouse 4' } as const;
    const mapper = new InputMapper(rebind(PRESETS.wasd, 'gadget-1', sideButton, 'swap'));

    expect(intentFor(mapper, snapshotWith([], [3])).triggered).toEqual(['gadget-1']);
  });
});
