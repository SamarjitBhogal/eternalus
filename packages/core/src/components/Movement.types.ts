/** One push under way on a `Movement` (a dash or knock-back): its share per tick and the ticks left. */
export type ForcedPush = {
  readonly x: number;
  readonly y: number;
  ticksLeft: number;
};
