import { describe, expect, it } from 'vitest';

import { CathedralGemState } from './CathedralGemState';

describe('CathedralGemState', () => {
  it('starts neutral and dark, never struck', () => {
    expect(new CathedralGemState()).toMatchObject({
      holder: 'neutral',
      glowTicksLeft: 0,
      glowHits: 0,
      ticksSinceHit: null,
    });
  });

  it('follows the holder it is handed', () => {
    const gem = new CathedralGemState();
    gem.hold('dark');
    expect(gem.holder).toBe('dark');
  });

  it('counts hits while lit, fades a tick at a time and forgets the hits when dark', () => {
    const gem = new CathedralGemState();
    gem.struck(3);
    gem.age();
    gem.struck(3);
    expect(gem).toMatchObject({ glowTicksLeft: 3, glowHits: 2, ticksSinceHit: 0 });

    gem.age();
    gem.age();
    expect(gem).toMatchObject({ glowTicksLeft: 1, glowHits: 2, ticksSinceHit: 2 });
    gem.age();
    expect(gem).toMatchObject({ glowTicksLeft: 0, glowHits: 0, ticksSinceHit: 3 });
    gem.age();
    expect(gem.glowTicksLeft).toBe(0);

    gem.struck(3);
    expect(gem.glowHits).toBe(1);
    expect(gem.fields).toEqual(['neutral', 3, 1, 0]);
  });
});
