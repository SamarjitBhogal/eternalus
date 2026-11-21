import { describe, expect, it } from 'vitest';

import { Veterancy } from './Veterancy';

describe('Veterancy', () => {
  it('marks every second kill as one that earns a level, and gains none by itself', () => {
    const veterancy = new Veterancy();
    const levelUps = Array.from({ length: 8 }, () => veterancy.recordKill(2));

    expect(levelUps).toEqual([false, true, false, true, false, true, false, true]);
    expect(veterancy.kills).toBe(8);
    expect(veterancy.level).toBe(0);
  });

  it('gains levels up to the cap, and a later kill never takes them back (DEC-168)', () => {
    const veterancy = new Veterancy();

    expect(veterancy.gainLevels(1, 3)).toBe(1);
    veterancy.recordKill(2);
    veterancy.recordKill(2);
    expect(veterancy.level).toBe(1);
    expect(veterancy.gainLevels(5, 3)).toBe(2);
    expect(veterancy.gainLevels(1, 3)).toBe(0);
    expect(veterancy.level).toBe(3);
  });
});
