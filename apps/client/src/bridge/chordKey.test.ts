import { describe, expect, it } from 'vitest';

import { chordKey } from './chordKey';

describe('chordKey', () => {
  it('names a plain key or button by its device and code', () => {
    expect(chordKey({ device: 'keyboard', code: 'KeyW' })).toBe('keyboard:KeyW');
    expect(chordKey({ device: 'mouse', code: '3', modifiers: [] })).toBe('mouse:3');
  });

  it('puts the modifiers first, sorted, so their order does not matter (DEC-105)', () => {
    const ctrlShift = chordKey({ device: 'keyboard', code: 'F3', modifiers: ['Shift', 'Control'] });

    expect(ctrlShift).toBe('keyboard:Control+Shift+F3');
    expect(chordKey({ device: 'keyboard', code: 'F3', modifiers: ['Control', 'Shift'] })).toBe(
      ctrlShift,
    );
    expect(chordKey({ device: 'keyboard', code: 'F3' })).not.toBe(ctrlShift);
  });
});
