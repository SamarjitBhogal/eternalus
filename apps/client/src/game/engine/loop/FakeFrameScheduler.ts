import type { FrameCallback, FrameHandle, FrameScheduler } from './FrameScheduler.types';

/**
 * A scheduler for tests: time moves only when the test calls `advance` or `runFrames`
 * (architecture 08 §3). At most one frame is pending, as with `requestAnimationFrame` in a loop.
 */
export class FakeFrameScheduler implements FrameScheduler {
  private pending: { readonly handle: FrameHandle; readonly callback: FrameCallback } | null = null;

  private lastHandle = 0;

  /** Creates a scheduler whose clock starts at `nowMs` milliseconds. */
  public constructor(private nowMs = 0) {}

  /** Whether a frame is waiting to fire. */
  public get hasPendingFrame(): boolean {
    return this.pending !== null;
  }

  /** Stores `callback` as the pending frame. */
  public request(callback: FrameCallback): FrameHandle {
    this.lastHandle += 1;
    this.pending = { handle: this.lastHandle, callback };
    return this.lastHandle;
  }

  /** Drops the pending frame if `handle` is its handle. */
  public cancel(handle: FrameHandle): void {
    if (this.pending?.handle === handle) {
      this.pending = null;
    }
  }

  /** Moves time forward by `ms` and fires the pending frame, if any, with the new time. */
  public advance(ms: number): void {
    this.nowMs += ms;
    const frame = this.pending;
    this.pending = null;
    frame?.callback(this.nowMs);
  }

  /** Fires `count` frames, `frameMs` apart. */
  public runFrames(count: number, frameMs: number): void {
    for (let frame = 0; frame < count; frame += 1) {
      this.advance(frameMs);
    }
  }
}
