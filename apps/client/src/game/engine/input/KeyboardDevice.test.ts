import { describe, expect, it } from 'vitest';

import { fakeKeyEvent } from './fakeKeyEvent';
import { describeInputDevice } from './InputDevice.contract';
import type { MutableInputSnapshot } from './InputDevice.types';
import { KeyboardDevice } from './KeyboardDevice';

const emptySnapshot = (): MutableInputSnapshot => ({
  keys: new Set(),
  keyLabels: new Map(),
  mouseButtons: 0,
  pointer: null,
});

const setUp = (bound: readonly string[] = ['KeyW']) => {
  const target = new EventTarget();
  const keyboard = new KeyboardDevice((code) => bound.includes(code));
  keyboard.attach(target);
  const held = (): ReadonlySet<string> => {
    const snapshot = emptySnapshot();
    keyboard.writeInto(snapshot);
    return snapshot.keys;
  };
  return { target, keyboard, held };
};

describeInputDevice('KeyboardDevice', () => {
  const { target, keyboard } = setUp();
  return {
    device: keyboard,
    target,
    press: () => target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW')),
    release: () => target.dispatchEvent(fakeKeyEvent('keyup', 'KeyW')),
  };
});

describe('KeyboardDevice', () => {
  it('keeps the key label seen at press, for prompts', () => {
    const { target, keyboard } = setUp();
    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW', { key: 'z' }));

    const snapshot = emptySnapshot();
    keyboard.writeInto(snapshot);

    expect(snapshot.keyLabels.get('KeyW')).toBe('z');
  });

  it('ignores auto-repeat: a repeated key-down after the release does not hold the key', () => {
    const { target, held } = setUp();
    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW'));
    target.dispatchEvent(fakeKeyEvent('keyup', 'KeyW'));

    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW', { repeat: true }));

    expect(held().size).toBe(0);
  });

  it('cancels the browser default only for bound keys, never for Ctrl chords or Tab', () => {
    const { target } = setUp(['KeyW', 'Tab']);
    const bound = fakeKeyEvent('keydown', 'KeyW');
    const unbound = fakeKeyEvent('keydown', 'KeyQ');
    const ctrlChord = fakeKeyEvent('keydown', 'KeyW', { ctrlKey: true });
    const tab = fakeKeyEvent('keydown', 'Tab');

    [bound, unbound, ctrlChord, tab].forEach((event) => target.dispatchEvent(event));

    expect([bound, unbound, ctrlChord, tab].map((event) => event.defaultPrevented)).toEqual([
      true,
      false,
      false,
      false,
    ]);
  });

  it('uses the key when the code is empty (mobile virtual keyboards)', () => {
    const { target, held } = setUp();

    target.dispatchEvent(fakeKeyEvent('keydown', '', { key: 'w' }));

    expect([...held()]).toEqual(['w']);
  });

  it('ignores events that are not key events', () => {
    const { target, held } = setUp();

    target.dispatchEvent(new Event('keydown'));
    target.dispatchEvent(new Event('keyup'));

    expect(held().size).toBe(0);
  });

  it('listens to one target only: attaching again moves it to the new target', () => {
    const { target, keyboard, held } = setUp();
    const other = new EventTarget();
    keyboard.attach(other);

    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW'));
    other.dispatchEvent(fakeKeyEvent('keydown', 'KeyD'));

    expect([...held()]).toEqual(['KeyD']);
  });
});
