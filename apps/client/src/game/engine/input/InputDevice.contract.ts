import { describe, expect, it } from 'vitest';

import type { InputDevice, MutableInputSnapshot } from './InputDevice.types';

/** One device under test: attached to `target`, with a way to press and release one input. */
export type InputDeviceHarness = {
  readonly device: InputDevice;
  readonly target: EventTarget;
  readonly press: () => void;
  readonly release: () => void;
};

const emptySnapshot = (): MutableInputSnapshot => ({
  keys: new Set(),
  keyLabels: new Map(),
  mouseButtons: 0,
  pointer: null,
});

const isHolding = (device: InputDevice): boolean => {
  const snapshot = emptySnapshot();
  device.writeInto(snapshot);
  return snapshot.keys.size > 0 || snapshot.mouseButtons !== 0;
};

/**
 * The rules every `InputDevice` adapter and double must pass (architecture 09 §9). Adding a
 * device is one `describeInputDevice` line in its test.
 */
export const describeInputDevice = (name: string, make: () => InputDeviceHarness): void => {
  describe(`${name} InputDevice contract`, () => {
    it('reports an input held after the press and clears it after the release', () => {
      const { device, press, release } = make();

      press();
      const afterPress = isHolding(device);
      release();

      expect([afterPress, isHolding(device)]).toEqual([true, false]);
    });

    it('never leaves anything held after releaseAll()', () => {
      const { device, press } = make();
      press();

      device.releaseAll();

      expect(isHolding(device)).toBe(false);
    });

    it('stops reporting after detach()', () => {
      const { device, press } = make();
      device.detach();

      press();

      expect(isHolding(device)).toBe(false);
    });

    it('merges into a snapshot without overwriting other devices', () => {
      const { device, press } = make();
      press();
      const snapshot = emptySnapshot();
      snapshot.keys.add('other-device');
      snapshot.mouseButtons = 16;

      device.writeInto(snapshot);

      expect(snapshot.keys.has('other-device')).toBe(true);
      expect(snapshot.mouseButtons & 16).toBe(16);
      // The device's own input was added on top of the other device's.
      expect(snapshot.keys.size > 1 || snapshot.mouseButtons !== 16).toBe(true);
    });
  });
};
