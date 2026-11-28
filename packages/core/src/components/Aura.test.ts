import { describe, expect, it } from 'vitest';

import { Aura } from './Aura';

const aura = (radius: number) =>
  new Aura({ radius, allyStatusId: 'tower-aura-buff', enemyStatusId: 'tower-aura-debuff' });

describe('Aura', () => {
  it('keeps its definition', () => {
    expect(aura(12).definition).toEqual({
      radius: 12,
      allyStatusId: 'tower-aura-buff',
      enemyStatusId: 'tower-aura-debuff',
    });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects the radius %s', (radius) => {
    expect(() => aura(radius)).toThrow('positive finite radius');
  });
});
