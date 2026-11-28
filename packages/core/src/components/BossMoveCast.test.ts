import { describe, expect, it } from 'vitest';

import { BossMoveCast } from './BossMoveCast';

describe('BossMoveCast', () => {
  it('starts empty', () => {
    expect(new BossMoveCast().fields).toEqual([null, 0]);
  });

  it('holds the move and its landing tick, a later move replacing it, until cleared', () => {
    const cast = new BossMoveCast();

    cast.begin('greater-boss-slam', 40);
    expect([cast.moveId, cast.landTick]).toEqual(['greater-boss-slam', 40]);
    cast.begin('greater-boss-sweep', 55);
    expect(cast.fields).toEqual(['greater-boss-sweep', 55]);
    cast.clear();
    expect(cast.fields).toEqual([null, 0]);
  });
});
