import {
  CONVERGENCE_EPSILON,
  DEFAULT_RATING,
  MAX_ITERATIONS,
  SCALE,
  SYSTEM_TAU,
} from './Glicko2.constants';
import type { GameResult, Rating } from './Glicko2.types';

/**
 * The Glicko-2 rating update, as in Glickman's "Example of the Glicko-2 system" (step numbers
 * in the comments are the paper's). Pure: no I/O, no clock.
 */
export class Glicko2 {
  /**
   * The player's new rating after one rating period of `games`. With no games only the
   * deviation grows, by the volatility. A result that is not finite leaves the player unchanged.
   */
  public update(player: Rating, games: readonly GameResult[]): Rating {
    const phi = player.deviation / SCALE; // step 2
    if (games.length === 0) {
      return { ...player, deviation: Math.sqrt(phi ** 2 + player.volatility ** 2) * SCALE };
    }
    const mu = (player.rating - DEFAULT_RATING) / SCALE;
    const opponents = games.map(({ opponent, score }) => {
      const g = this.g(opponent.deviation / SCALE);
      const e = 1 / (1 + Math.exp(-g * (mu - (opponent.rating - DEFAULT_RATING) / SCALE)));
      return { g, e, score };
    });
    const variance = 1 / opponents.reduce((sum, { g, e }) => sum + g ** 2 * e * (1 - e), 0); // step 3
    const gain = opponents.reduce((sum, { g, e, score }) => sum + g * (score - e), 0);
    const volatility = this.newVolatility(phi, player.volatility, variance, variance * gain); // step 5
    const starPhi = Math.sqrt(phi ** 2 + volatility ** 2); // step 6
    const newPhi = 1 / Math.sqrt(1 / starPhi ** 2 + 1 / variance); // step 7
    const next = {
      rating: (mu + newPhi ** 2 * gain) * SCALE + DEFAULT_RATING,
      deviation: newPhi * SCALE,
      volatility,
    };
    // A degenerate input (an absurd opponent rating) keeps the old rating instead of NaN.
    return Object.values(next).every(Number.isFinite) ? next : player;
  }

  private g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi ** 2) / Math.PI ** 2);
  }

  /** Step 5: the new volatility by the Illinois (regula falsi) iteration. */
  private newVolatility(phi: number, sigma: number, variance: number, delta: number): number {
    const a = Math.log(sigma ** 2);
    const f = (x: number): number => {
      const ex = Math.exp(x);
      const denominator = 2 * (phi ** 2 + variance + ex) ** 2;
      return (
        (ex * (delta ** 2 - phi ** 2 - variance - ex)) / denominator - (x - a) / SYSTEM_TAU ** 2
      );
    };
    let lower = a;
    let upper: number;
    if (delta ** 2 > phi ** 2 + variance) {
      upper = Math.log(delta ** 2 - phi ** 2 - variance);
    } else {
      let k = 1;
      while (f(a - k * SYSTEM_TAU) < 0 && k < MAX_ITERATIONS) k += 1;
      upper = a - k * SYSTEM_TAU;
    }
    let fLower = f(lower);
    let fUpper = f(upper);
    for (let i = 0; i < MAX_ITERATIONS && Math.abs(upper - lower) > CONVERGENCE_EPSILON; i += 1) {
      const c = lower + ((lower - upper) * fLower) / (fUpper - fLower);
      const fC = f(c);
      if (fC * fUpper <= 0) {
        lower = upper;
        fLower = fUpper;
      } else {
        fLower /= 2;
      }
      upper = c;
      fUpper = fC;
    }
    return Math.exp(lower / 2);
  }
}
