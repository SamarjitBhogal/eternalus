import { describe, expect, it } from 'vitest';

import { describeInputDevice, syntheticEvent } from './InputDevice.contract';
import type { MutableInputSnapshot } from './InputDevice.types';
import { MouseDevice } from './MouseDevice';

type PointerFields = { button: number; buttons: number; offsetX?: number; offsetY?: number };

function pointerEvent(type: string, fields: PointerFields): Event {
  return syntheticEvent(type, { offsetX: 0, offsetY: 0, pointerId: 1, ...fields });
}

function read(device: MouseDevice): MutableInputSnapshot {
  const snapshot: MutableInputSnapshot = {
    keys: new Set(),
    mouseButtons: new Set(),
    pointer: null,
  };
  device.writeInto(snapshot);
  return snapshot;
}

function attachedMouse(): { device: MouseDevice; target: EventTarget } {
  const device = new MouseDevice();
  const target = new EventTarget();
  device.attach(target);
  return { device, target };
}

describeInputDevice('MouseDevice', () => {
  const device = new MouseDevice();
  const target = new EventTarget();
  return {
    device,
    target,
    // The back side button: MouseEvent.button 3, PointerEvent.buttons bit 8.
    press: () => target.dispatchEvent(pointerEvent('pointerdown', { button: 3, buttons: 8 })),
    release: () => target.dispatchEvent(pointerEvent('pointerup', { button: 3, buttons: 0 })),
    repeat: () => undefined, // mouse buttons do not auto-repeat
    isHeld: (snapshot) => snapshot.mouseButtons.has(3),
  };
});

describe('MouseDevice', () => {
  it('reads both side buttons from the buttons bitmask', () => {
    const { device, target } = attachedMouse();

    target.dispatchEvent(pointerEvent('pointerdown', { button: 4, buttons: 8 | 16 }));

    expect([...read(device).mouseButtons].sort()).toEqual([3, 4]);
  });

  it('maps the bitmask to MouseEvent.button numbers (right is 2, wheel is 1)', () => {
    const { device, target } = attachedMouse();

    // A second button pressed while the first is held arrives as a pointermove.
    target.dispatchEvent(pointerEvent('pointerdown', { button: 2, buttons: 2 }));
    target.dispatchEvent(pointerEvent('pointermove', { button: 1, buttons: 2 | 4 }));

    expect([...read(device).mouseButtons].sort()).toEqual([1, 2]);
  });

  it('records the pointer position on the target', () => {
    const { device, target } = attachedMouse();

    target.dispatchEvent(
      pointerEvent('pointermove', { button: -1, buttons: 0, offsetX: 40, offsetY: 25 }),
    );

    expect(read(device).pointer).toEqual({ x: 40, y: 25 });
  });

  it('forgets the pointer when it leaves the target or the device detaches', () => {
    const { device, target } = attachedMouse();
    const moveTo = (x: number, y: number): void => {
      target.dispatchEvent(
        pointerEvent('pointermove', { button: -1, buttons: 0, offsetX: x, offsetY: y }),
      );
    };

    moveTo(40, 25);
    target.dispatchEvent(new Event('pointerleave'));
    const afterLeave = read(device).pointer;
    moveTo(10, 10);
    device.detach();

    expect(afterLeave).toBeNull();
    expect(read(device).pointer).toBeNull();
  });

  it('cancels the browser action of non-main buttons but not of the main one', () => {
    const { target } = attachedMouse();
    const side = pointerEvent('pointerdown', { button: 3, buttons: 8 });
    const main = pointerEvent('pointerdown', { button: 0, buttons: 1 });

    target.dispatchEvent(side);
    target.dispatchEvent(main);

    expect(side.defaultPrevented).toBe(true);
    expect(main.defaultPrevented).toBe(false);
  });

  it.each(['contextmenu', 'auxclick'])(
    'suppresses %s so the button stays a game button',
    (type) => {
      const { target } = attachedMouse();
      const event = syntheticEvent(type, {});

      target.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    },
  );

  it('captures the pointer on press when the target supports it', () => {
    const device = new MouseDevice();
    const captured: number[] = [];
    const target = Object.assign(new EventTarget(), {
      setPointerCapture: (pointerId: number) => captured.push(pointerId),
    });
    device.attach(target);

    target.dispatchEvent(pointerEvent('pointerdown', { button: 0, buttons: 1 }));

    expect(captured).toEqual([1]);
  });

  it('releases every button when the browser cancels the pointer', () => {
    const { device, target } = attachedMouse();
    target.dispatchEvent(pointerEvent('pointerdown', { button: 0, buttons: 1 }));

    target.dispatchEvent(new Event('pointercancel'));

    expect(read(device).mouseButtons.size).toBe(0);
  });
});
