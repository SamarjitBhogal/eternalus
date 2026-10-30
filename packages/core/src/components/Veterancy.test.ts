import { describe, expect, it } from 'vitest';

import { Veterancy } from './Veterancy';

describe('Veterancy', () => {
  it('earns a level every two kills, up to the cap', () => {
    const veterancy = new Veterancy();
    const levelUps = Array.from({ length: 8 }, () => veterancy.recordKill(2, 3));

    expect(levelUps).toEqual([false, true, false, true, false, true, false, false]);
    expect(veterancy.kills).toBe(8);
    expect(veterancy.level).toBe(3);
  });
});
