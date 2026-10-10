/** What the loop drives: whole simulation ticks, then one render per frame. */
export interface LoopTarget {
  /** Advances the game by exactly one fixed tick. */
  tick(): void;
  /** Draws the frame; `alpha` in [0, 1) is how far the frame is between the last two ticks. */
  render(alpha: number): void;
}

/** The loop's timing (architecture 08 §2, 03 §7). */
export type GameLoopOptions = {
  /** Length of one tick in milliseconds: `1000 / tickRate`. */
  readonly tickMs: number;
  /** The longest gap a single frame may account for; `5 × tickMs` by design. */
  readonly maxFrameMs: number;
};
