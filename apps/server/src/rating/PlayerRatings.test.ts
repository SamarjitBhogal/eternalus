import { describe, expect, it } from 'vitest';
import { PlayerRatings } from './PlayerRatings';

describe('PlayerRatings', () => {
  it('starts a new player at 1500 / 350 / 0.06 with an empty record', () => {
    expect(new PlayerRatings().get('a')).toEqual({
      rating: 1500,
      deviation: 350,
      volatility: 0.06,
      wins: 0,
      losses: 0,
      streak: 0,
      matches: 0,
    });
  });

  it('rates both players after a win, from their ratings before the match', () => {
    const ratings = new PlayerRatings();
    ratings.recordMatch('a', 'b', 'light');
    const [a, b] = [ratings.get('a'), ratings.get('b')];
    expect(a).toMatchObject({ wins: 1, losses: 0, streak: 1, matches: 1 });
    expect(b).toMatchObject({ wins: 0, losses: 1, streak: -1, matches: 1 });
    expect(a.rating).toBeGreaterThan(1500);
    expect(a.rating - 1500).toBeCloseTo(1500 - b.rating, 6);
  });

  it('counts a dark win for the dark seat', () => {
    const ratings = new PlayerRatings();
    ratings.recordMatch('a', 'b', 'dark');
    expect(ratings.get('b').wins).toBe(1);
    expect(ratings.get('a').losses).toBe(1);
  });

  it('runs and breaks streaks, and a draw clears them', () => {
    const ratings = new PlayerRatings();
    ratings.recordMatch('a', 'b', 'light');
    ratings.recordMatch('a', 'b', 'light');
    expect(ratings.get('a').streak).toBe(2);
    expect(ratings.get('b').streak).toBe(-2);
    ratings.recordMatch('a', 'b', 'dark');
    expect(ratings.get('a').streak).toBe(-1);
    expect(ratings.get('b').streak).toBe(1);
    ratings.recordMatch('a', 'b', null);
    expect(ratings.get('a')).toMatchObject({ streak: 0, matches: 4, wins: 2, losses: 1 });
  });

  it('forgets a player, who then starts again from the default', () => {
    const ratings = new PlayerRatings();
    ratings.recordMatch('a', 'b', 'light');
    ratings.forget('a');
    expect(ratings.get('a').matches).toBe(0);
    expect(ratings.get('b').matches).toBe(1);
  });

  it('leaves two equal players at the same rating after a draw', () => {
    const ratings = new PlayerRatings();
    ratings.recordMatch('a', 'b', null);
    expect(ratings.get('a').rating).toBeCloseTo(1500, 6);
    expect(ratings.get('a').deviation).toBeLessThan(350);
  });
});
