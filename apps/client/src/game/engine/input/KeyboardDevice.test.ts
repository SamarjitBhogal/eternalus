import { describe, expect, it } from 'vitest';

import { fakeKeyEvent } from './fakeKeyEvent';
import type { MutableInputSnapshot } from './InputDevice.types';
import { KeyboardDevice } from './KeyboardDevice';

const emptySnapshot = (): MutableInputSnapshot => ({ keys: new Set(), keyLabels: new Map() });

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

describe('KeyboardDevice', () => {
  it('reports a key held after key-down and clears it after key-up', () => {
    const { target, held } = setUp();

    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW'));
    expect([...held()]).toEqual(['KeyW']);

    target.dispatchEvent(fakeKeyEvent('keyup', 'KeyW'));
    expect(held().size).toBe(0);
  });

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

  it('leaves nothing held after releaseAll', () => {
    const { target, keyboard, held } = setUp();
    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW'));
    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyD'));

    keyboard.releaseAll();

    expect(held().size).toBe(0);
  });

  it('hears nothing after detach', () => {
    const { target, keyboard, held } = setUp();
    keyboard.detach();

    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW'));

    expect(held().size).toBe(0);
  });

  it('adds to a snapshot without removing what another device wrote', () => {
    const { target, keyboard } = setUp();
    target.dispatchEvent(fakeKeyEvent('keydown', 'KeyW'));
    const snapshot = emptySnapshot();
    snapshot.keys.add('KeyQ');

    keyboard.writeInto(snapshot);

    expect([...snapshot.keys].sort()).toEqual(['KeyQ', 'KeyW']);
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
