import { describe, expect, it } from 'vitest';

import { FakeInputDevice } from './FakeInputDevice';
import { describeInputDevice } from './InputDevice.contract';
import type { MutableInputSnapshot } from './InputDevice.types';

describeInputDevice('FakeInputDevice', () => {
  const device = new FakeInputDevice();
  return {
    device,
    target: new EventTarget(),
    press: () => {
      device.press('KeyW');
    },
    release: () => {
      device.release('KeyW');
    },
    repeat: () => undefined, // a fake has no auto-repeat
    isHeld: (snapshot) => snapshot.keys.has('KeyW'),
  };
});

describe('FakeInputDevice', () => {
  it('reports scripted buttons and the pointer', () => {
    const device = new FakeInputDevice();
    device.attach();
    device.pressButton(3);
    device.movePointer({ x: 5, y: 6 });
    const snapshot: MutableInputSnapshot = {
      keys: new Set(),
      mouseButtons: new Set(),
      pointer: null,
    };

    device.writeInto(snapshot);
    device.releaseButton(3);

    expect([...snapshot.mouseButtons]).toEqual([3]);
    expect(snapshot.pointer).toEqual({ x: 5, y: 6 });
  });
});
