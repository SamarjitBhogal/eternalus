/** A player's Glicko-2 rating, on the usual scale (a new player is 1500, 350, 0.06). */
export type Rating = {
  readonly rating: number;
  /** Rating deviation: how uncertain the rating is. */
  readonly deviation: number;
  readonly volatility: number;
};

/** One game in a rating period: who the opponent was and the score (1 win, 0.5 draw, 0 loss). */
export type GameResult = {
  readonly opponent: Rating;
  readonly score: number;
};
