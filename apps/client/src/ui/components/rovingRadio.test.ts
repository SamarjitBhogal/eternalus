import { describe, expect, it } from 'vitest';

import { nextRovingIndex, tabbableRovingIndex } from './rovingRadio';

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
