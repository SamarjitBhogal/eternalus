import { describe, expect, it } from 'vitest';

import { describeInputDevice, syntheticEvent } from './InputDevice.contract';
import type { MutableInputSnapshot } from './InputDevice.types';
import { KeyboardDevice } from './KeyboardDevice';

type KeyFields = { code: string; key: string; repeat?: boolean; ctrlKey?: boolean };

function keyEvent(type: 'keydown' | 'keyup', fields: KeyFields): Event {
  return syntheticEvent(type, { repeat: false, ctrlKey: false, metaKey: false, ...fields });
}

function heldKeys(device: KeyboardDevice): ReadonlySet<string> {
  const snapshot: MutableInputSnapshot = {
    keys: new Set(),
    mouseButtons: new Set(),
    pointer: null,
  };
  device.writeInto(snapshot);
  return snapshot.keys;
}

function attachedKeyboard(isBound: (code: string) => boolean = () => true): {
  device: KeyboardDevice;
  target: EventTarget;
} {
  const device = new KeyboardDevice(isBound);
  const target = new EventTarget();
  device.attach(target);
  return { device, target };
}

describeInputDevice('KeyboardDevice', () => {
  const device = new KeyboardDevice(() => true);
  const target = new EventTarget();
  return {
    device,
    target,
    press: () => target.dispatchEvent(keyEvent('keydown', { code: 'KeyW', key: 'w' })),
    release: () => target.dispatchEvent(keyEvent('keyup', { code: 'KeyW', key: 'w' })),
    repeat: () =>
      target.dispatchEvent(keyEvent('keydown', { code: 'KeyW', key: 'w', repeat: true })),
    isHeld: (snapshot) => snapshot.keys.has('KeyW'),
  };
});

describe('KeyboardDevice', () => {
  it('tracks the physical key (code), not the character it types (key)', () => {
    const { device, target } = attachedKeyboard();

    // On an AZERTY keyboard the key in the W position types "z".
    target.dispatchEvent(keyEvent('keydown', { code: 'KeyW', key: 'z' }));

    expect([...heldKeys(device)]).toEqual(['KeyW']);
  });

  it('falls back to key when a virtual keyboard reports no code', () => {
    const { device, target } = attachedKeyboard();

    target.dispatchEvent(keyEvent('keydown', { code: '', key: 'w' }));

    expect([...heldKeys(device)]).toEqual(['w']);
  });

  it('prevents the browser default for bound keys only', () => {
    const { target } = attachedKeyboard((code) => code === 'KeyW');
    const bound = keyEvent('keydown', { code: 'KeyW', key: 'w' });
    const unbound = keyEvent('keydown', { code: 'KeyQ', key: 'q' });

    target.dispatchEvent(bound);
    target.dispatchEvent(unbound);

    expect(bound.defaultPrevented).toBe(true);
    expect(unbound.defaultPrevented).toBe(false);
  });

  it('never prevents Tab, F5, F12 or Ctrl/Meta shortcuts, even when bound', () => {
    const { target } = attachedKeyboard();
    const events = [
      keyEvent('keydown', { code: 'Tab', key: 'Tab' }),
      keyEvent('keydown', { code: 'F5', key: 'F5' }),
      keyEvent('keydown', { code: 'F12', key: 'F12' }),
      keyEvent('keydown', { code: 'KeyW', key: 'w', ctrlKey: true }),
    ];

    events.forEach((event) => target.dispatchEvent(event));

    expect(events.map((event) => event.defaultPrevented)).toEqual([false, false, false, false]);
  });

  it('still prevents the default of an auto-repeat of a bound key', () => {
    const { target } = attachedKeyboard();
    const repeat = keyEvent('keydown', { code: 'ArrowDown', key: 'ArrowDown', repeat: true });

    target.dispatchEvent(repeat);

    expect(repeat.defaultPrevented).toBe(true); // the page must not scroll while a key is held
  });

  it.each(['blur', 'visibilitychange'])('releases every key on %s', (type) => {
    const { device, target } = attachedKeyboard();
    target.dispatchEvent(keyEvent('keydown', { code: 'KeyW', key: 'w' }));

    target.dispatchEvent(new Event(type));

    expect(heldKeys(device).size).toBe(0);
  });
});
