import { describe, expect, it, vi } from 'vitest';

import { fakePointerEvent } from './fakePointerEvent';
import { describeInputDevice } from './InputDevice.contract';
import type { MutableInputSnapshot } from './InputDevice.types';
import { MouseDevice } from './MouseDevice';

const LEFT = 1;
const BACK = 8;

const setUp = () => {
  const target = new EventTarget();
  const mouse = new MouseDevice();
  mouse.attach(target);
  const read = (): MutableInputSnapshot => {
    const snapshot: MutableInputSnapshot = {
      keys: new Set(),
      keyLabels: new Map(),
      mouseButtons: 0,
      pointer: null,
    };
    mouse.writeInto(snapshot);
    return snapshot;
  };
  return { target, mouse, read };
};

describeInputDevice('MouseDevice', () => {
  const { target, mouse } = setUp();
  return {
    device: mouse,
    target,
    press: () => target.dispatchEvent(fakePointerEvent('pointerdown', { buttons: LEFT })),
    release: () => target.dispatchEvent(fakePointerEvent('pointerup', { buttons: 0 })),
  };
});

describe('MouseDevice', () => {
  it('reads side buttons from the buttons bitmask', () => {
    const { target, read } = setUp();

    target.dispatchEvent(fakePointerEvent('pointerdown', { buttons: LEFT | BACK, button: 3 }));

    expect(read().mouseButtons).toBe(LEFT | BACK);
  });

  it('tracks the pointer on the canvas and forgets it when the pointer leaves', () => {
    const { target, read } = setUp();

    target.dispatchEvent(fakePointerEvent('pointermove', { x: 120, y: 45 }));
    const onCanvas = read().pointer;
    target.dispatchEvent(fakePointerEvent('pointerleave'));

    expect(onCanvas).toEqual({ x: 120, y: 45 });
    expect(read().pointer).toBeNull();
  });

  it('keeps the pointer another device wrote when it has none', () => {
    const { mouse } = setUp();
    const snapshot: MutableInputSnapshot = {
      keys: new Set(),
      keyLabels: new Map(),
      mouseButtons: 0,
      pointer: { x: 1, y: 2 },
    };

    mouse.writeInto(snapshot);

    expect(snapshot.pointer).toEqual({ x: 1, y: 2 });
  });

  it('cancels the context menu, middle-click tabs and non-primary presses, not a left click', () => {
    const { target } = setUp();
    const contextMenu = new Event('contextmenu', { cancelable: true });
    const auxClick = new Event('auxclick', { cancelable: true });
    const rightPress = fakePointerEvent('pointerdown', { buttons: 2, button: 2 });
    const leftPress = fakePointerEvent('pointerdown', { buttons: LEFT, button: 0 });

    [contextMenu, auxClick, rightPress, leftPress].forEach((event) => target.dispatchEvent(event));

    expect([contextMenu, auxClick, rightPress, leftPress].map((e) => e.defaultPrevented)).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('cancels a chorded non-primary press (middle while left is held), and drops on cancel', () => {
    const { target, read } = setUp();
    target.dispatchEvent(fakePointerEvent('pointerdown', { buttons: LEFT }));
    const chord = fakePointerEvent('pointermove', { buttons: LEFT | 4 });
    const plainMove = fakePointerEvent('pointermove', { buttons: LEFT | 4 });

    target.dispatchEvent(chord);
    target.dispatchEvent(plainMove);
    target.dispatchEvent(fakePointerEvent('pointercancel'));

    expect([chord.defaultPrevented, plainMove.defaultPrevented]).toEqual([true, false]);
    expect(read().mouseButtons).toBe(0);
  });

  it('keeps the pointer through releaseAll, so aiming survives a focus loss', () => {
    const { target, mouse, read } = setUp();
    target.dispatchEvent(fakePointerEvent('pointerdown', { buttons: LEFT, x: 10, y: 20 }));

    mouse.releaseAll();

    expect(read()).toMatchObject({ mouseButtons: 0, pointer: { x: 10, y: 20 } });
  });

  it('captures the pointer on press, so a drag off the canvas still releases', () => {
    class FakeElement extends EventTarget {
      public readonly captured: number[] = [];

      public setPointerCapture(pointerId: number): void {
        this.captured.push(pointerId);
      }
    }
    vi.stubGlobal('Element', FakeElement);
    const canvas = new FakeElement();
    new MouseDevice().attach(canvas);

    canvas.dispatchEvent(fakePointerEvent('pointerdown', { buttons: LEFT }));
    vi.unstubAllGlobals();

    expect(canvas.captured).toEqual([1]);
  });

  it('ignores events that are not pointer events', () => {
    const { target, read } = setUp();

    target.dispatchEvent(new Event('pointerdown'));

    expect(read()).toMatchObject({ mouseButtons: 0, pointer: null });
  });

  it('stops cancelling the context menu after detach', () => {
    const { target, mouse } = setUp();
    mouse.detach();
    const contextMenu = new Event('contextmenu', { cancelable: true });

    target.dispatchEvent(contextMenu);

    expect(contextMenu.defaultPrevented).toBe(false);
  });
});
