/** The move the boss is casting, and its absolute phase boundaries. */
export type BossCast = {
  readonly id: string;
  readonly start: number;
  readonly fire: number;
  readonly recover: number;
  readonly end: number;
  readonly heading: number;
  readonly angle: number;
  readonly range: number;
  readonly width: number;
};
