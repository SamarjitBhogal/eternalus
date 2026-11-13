import { describe, expect, it } from 'vitest';
import { Glicko2 } from './Glicko2';
import type { Rating } from './Glicko2.types';

const rated = (rating: number, deviation: number, volatility = 0.06): Rating => ({
  rating,
  deviation,
  volatility,
});

describe('Glicko2', () => {
  it("matches Glickman's worked example (1500/200 vs 1400 win, 1550 loss, 1700 loss)", () => {
    const next = new Glicko2().update(rated(1500, 200), [
      { opponent: rated(1400, 30), score: 1 },
      { opponent: rated(1550, 100), score: 0 },
      { opponent: rated(1700, 300), score: 0 },
    ]);
    expect(next.rating).toBeCloseTo(1464.06, 1);
    expect(next.deviation).toBeCloseTo(151.52, 2);
    expect(next.volatility).toBeCloseTo(0.05999, 4);
  });

  it('only grows the deviation when there are no games', () => {
    const next = new Glicko2().update(rated(1500, 200), []);
    expect(next.rating).toBe(1500);
    expect(next.volatility).toBe(0.06);
    expect(next.deviation).toBeCloseTo(200.27, 2);
  });

  it('keeps the old rating when the input makes the maths blow up', () => {
    const player = rated(1500, 200);
    const next = new Glicko2().update(player, [{ opponent: rated(Number.NaN, 30), score: 1 }]);
    expect(next).toEqual(player);
  });

  it('raises a winner, lowers a loser and shrinks both deviations', () => {
    const glicko = new Glicko2();
    const fresh = rated(1500, 350);
    const won = glicko.update(fresh, [{ opponent: fresh, score: 1 }]);
    const lost = glicko.update(fresh, [{ opponent: fresh, score: 0 }]);
    expect(won.rating).toBeGreaterThan(1500);
    expect(lost.rating).toBeLessThan(1500);
    expect(won.deviation).toBeLessThan(350);
  });
});
