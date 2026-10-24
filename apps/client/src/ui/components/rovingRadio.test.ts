import { describe, expect, it } from 'vitest';

import { nextRovingIndex, rovingKeyDown, tabbableRovingIndex } from './rovingRadio';

const item = (isAvailable: boolean, isPicked = false) => ({ isAvailable, isPicked });

describe('nextRovingIndex', () => {
  it.each(['ArrowRight', 'ArrowDown'])('%s steps forward and wraps from the last to 0', (key) => {
    expect(nextRovingIndex(0, key, 3)).toBe(1);
    expect(nextRovingIndex(1, key, 3)).toBe(2);
    expect(nextRovingIndex(2, key, 3)).toBe(0);
  });

  it.each(['ArrowLeft', 'ArrowUp'])('%s steps back and wraps from 0 to the last', (key) => {
    expect(nextRovingIndex(2, key, 3)).toBe(1);
    expect(nextRovingIndex(1, key, 3)).toBe(0);
    expect(nextRovingIndex(0, key, 3)).toBe(2);
  });

  it('jumps to the first with Home and to the last with End', () => {
    expect(nextRovingIndex(2, 'Home', 4)).toBe(0);
    expect(nextRovingIndex(0, 'End', 4)).toBe(3);
  });

  it('stays on the only radio of a group of one', () => {
    for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']) {
      expect(nextRovingIndex(0, key, 1)).toBe(0);
    }
  });

  it.each(['Tab', 'a', 'Enter', ' ', 'Escape'])('ignores %j', (key) => {
    expect(nextRovingIndex(1, key, 3)).toBeNull();
  });

  it('has nowhere to go in an empty group', () => {
    expect(nextRovingIndex(0, 'ArrowRight', 0)).toBeNull();
    expect(nextRovingIndex(0, 'Home', 0)).toBeNull();
  });
});

describe('tabbableRovingIndex', () => {
  it('puts the tab stop on the picked radio', () => {
    expect(tabbableRovingIndex([item(true), item(true, true), item(true)])).toBe(1);
  });

  it('falls back to the first available radio, skipping locked ones', () => {
    expect(tabbableRovingIndex([item(false), item(false), item(true), item(true)])).toBe(2);
  });

  it('falls back to the first radio when every radio is locked, or there is none', () => {
    expect(tabbableRovingIndex([item(false), item(false)])).toBe(0);
    expect(tabbableRovingIndex([])).toBe(0);
  });
});

/**
 * A group of `count` radios, each a stand-in that records taking the focus, and `keyOn(key)`: a
 * key event on one of them, as the focus move reads it (its key, its default, its parent).
 */
function radioGroup(count: number, { isOrphan = false } = {}) {
  const focused: number[] = [];
  const queried: string[] = [];
  let prevented = 0;
  const radios = Array.from({ length: count }, (_, at) => ({
    focus: () => {
      focused.push(at);
    },
  }));
  const parent = {
    querySelectorAll: (selectors: string) => {
      queried.push(selectors);
      return radios;
    },
  };
  const keyOn = (key: string) => ({
    key,
    preventDefault: () => {
      prevented += 1;
    },
    currentTarget: { parentElement: isOrphan ? null : parent },
  });
  return { focused, queried, keyOn, prevented: () => prevented };
}

describe('rovingKeyDown', () => {
  it("asks `move` where the key goes, focuses that radio among the group's, and keeps the key", () => {
    const group = radioGroup(4);
    const asked: [number, string][] = [];
    const onKeyDown = rovingKeyDown((index, key) => {
      asked.push([index, key]);
      return 3;
    });

    onKeyDown(group.keyOn('End'), 1);

    expect(asked).toEqual([[1, 'End']]);
    expect(group.queried).toEqual(['[role="radio"]']);
    expect(group.focused).toEqual([3]);
    expect(group.prevented()).toBe(1);
  });

  it('moves the focus the way nextRovingIndex steps, wrapping at the ends', () => {
    const group = radioGroup(3);
    const onKeyDown = rovingKeyDown((index, key) => nextRovingIndex(index, key, 3));

    onKeyDown(group.keyOn('ArrowRight'), 2);
    onKeyDown(group.keyOn('ArrowUp'), 0);
    onKeyDown(group.keyOn('ArrowDown'), 0);

    expect(group.focused).toEqual([0, 2, 1]);
  });

  it('leaves any other key alone: no focus move, and its default kept', () => {
    const group = radioGroup(3);
    const onKeyDown = rovingKeyDown(() => null);

    onKeyDown(group.keyOn('Tab'), 1);

    expect(group.focused).toEqual([]);
    expect(group.queried).toEqual([]);
    expect(group.prevented()).toBe(0);
  });

  it('focuses nothing for a radio with no parent, or past the last radio', () => {
    const orphan = radioGroup(3, { isOrphan: true });
    rovingKeyDown(() => 1)(orphan.keyOn('ArrowRight'), 0);
    const short = radioGroup(2);
    rovingKeyDown(() => 5)(short.keyOn('End'), 0);

    expect(orphan.focused).toEqual([]);
    expect(short.focused).toEqual([]);
  });
});
