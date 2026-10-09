/** Receives the frame's timestamp in milliseconds. */
export type FrameCallback = (timestampMs: number) => void;

/** Identifies a requested frame so it can be cancelled. */
export type FrameHandle = number;

/**
 * Where the game loop gets its frames from (architecture 08 §3). The browser adapter wraps
 * `requestAnimationFrame`; tests use `FakeFrameScheduler`, which fully controls time.
 */
export interface FrameScheduler {
  /** Calls `callback` once, on the next frame. */
  request(callback: FrameCallback): FrameHandle;
  /** Cancels a frame requested earlier; unknown handles are ignored. */
  cancel(handle: FrameHandle): void;
}
