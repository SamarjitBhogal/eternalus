import { describe, expect, it } from 'vitest';

import type { InputDevice, InputSnapshot, MutableInputSnapshot } from './InputDevice.types';

/** What the contract suite needs to drive one device through one input. */
export type InputDeviceHarness = {
  readonly device: InputDevice;
  /** What the device attaches to. */
  readonly target: EventTarget;
  /** Presses the harness's input (a key, a button). */
  press(): void;
  /** Releases it. */
  release(): void;
  /** Sends an auto-repeat of the press; a no-op for devices that have none. */
  repeat(): void;
  /** Whether the harness's input shows as held in `snapshot`. */
  isHeld(snapshot: InputSnapshot): boolean;
};

/** A browser-like event for Node tests: an `Event` carrying the fields a device reads. */
export function syntheticEvent<T extends object>(type: string, fields: T): Event & T {
  return Object.assign(new Event(type, { cancelable: true }), fields);
}

function emptySnapshot(): MutableInputSnapshot {
  return { keys: new Set(), mouseButtons: new Set(), pointer: null };
}

function read(device: InputDevice): MutableInputSnapshot {
  const snapshot = emptySnapshot();
  device.writeInto(snapshot);
  return snapshot;
}

/**
 * The behaviour every `InputDevice` must share (architecture 09 §9). Each adapter's test calls
 * it once with a factory, so an adapter cannot merge without honouring the port.
 */
export function describeInputDevice(name: string, make: () => InputDeviceHarness): void {
  describe(`${name} InputDevice contract`, () => {
    function attached(): InputDeviceHarness {
      const harness = make();
      harness.device.attach(harness.target);
      return harness;
    }

    it('reports the input held after a press and not after the release', () => {
      const harness = attached();

      harness.press();
      const whilePressed = read(harness.device);
      harness.release();

      expect(harness.isHeld(whilePressed)).toBe(true);
      expect(harness.isHeld(read(harness.device))).toBe(false);
    });

    it('holds nothing after releaseAll()', () => {
      const harness = attached();
      harness.press();

      harness.device.releaseAll();

      expect(harness.isHeld(read(harness.device))).toBe(false);
    });

    it('does not turn an auto-repeat into a new press', () => {
      const harness = attached();
      harness.press();
      harness.device.releaseAll(); // focus lost while the key stays down

      harness.repeat();

      expect(harness.isHeld(read(harness.device))).toBe(false);
    });

    it('reports nothing after detach()', () => {
      const harness = attached();
      harness.press();

      harness.device.detach();
      harness.press();

      expect(harness.isHeld(read(harness.device))).toBe(false);
    });

    it('adds to a snapshot without removing what other devices wrote', () => {
      const harness = attached();
      harness.press();
      const snapshot = emptySnapshot();
      snapshot.keys.add('OtherDeviceKey');
      snapshot.mouseButtons.add(42);

      harness.device.writeInto(snapshot);

      expect(snapshot.keys.has('OtherDeviceKey')).toBe(true);
      expect(snapshot.mouseButtons.has(42)).toBe(true);
      expect(harness.isHeld(snapshot)).toBe(true);
    });
  });
}
