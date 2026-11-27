import { describe, expect, it } from 'vitest';
import { MinionHeadBuilder } from './MinionHeadBuilder';
import { MINION_PALETTES } from './MinionView.constants';

describe('MinionHeadBuilder', () => {
  it('keeps the horned and crested factions distinct with their own eyes and trim', () => {
    const heads = Object.values(MINION_PALETTES).map((palette) => {
      const head = new MinionHeadBuilder().build(palette);
      expect(head.some((part) => part.color === palette.eyes)).toBe(true);
      expect(head.every((part) => part.shape.length >= 3)).toBe(true);
      return head;
    });
    expect(heads[0]).not.toEqual(heads[1]);
  });
});
