import type { FrameHandle, FrameScheduler } from './FrameScheduler.types';
import { TICK_EPSILON_MS } from './GameLoop.constants';
import type { GameLoopOptions, LoopTarget } from './GameLoop.types';

/**
 * The fixed-timestep loop (architecture 08 §2): each frame adds the elapsed time (clamped to
 * `maxFrameMs`) to an accumulator, runs whole ticks while it holds at least `tickMs`, then
 * renders with `alpha = accumulator / tickMs`. It reads time only from the scheduler, so a fake
 * scheduler controls it completely in tests.
 */
export class GameLoop {
  private accumulatorMs = 0;

  private lastTimestampMs: number | null = null;

  private handle: FrameHandle | null = null;

  private isDestroyed = false;

  /**
   * Creates a stopped loop.
   *
   * @param scheduler - Where frames come from.
   * @param target - What each tick and frame drive.
   * @param options - Tick length and frame clamp, in milliseconds.
   */
  public constructor(
    private readonly scheduler: FrameScheduler,
    private readonly target: LoopTarget,
    private readonly options: GameLoopOptions,
  ) {
    if (!(options.tickMs > 0) || !(options.maxFrameMs >= options.tickMs)) {
      throw new RangeError(
        `GameLoop needs tickMs > 0 and maxFrameMs >= tickMs, got ${String(options.tickMs)} and ${String(options.maxFrameMs)}.`,
      );
    }
  }

  /** Whether a frame is pending. */
  public get isRunning(): boolean {
    return this.handle !== null;
  }

  /** Requests the first frame. Does nothing if already running or destroyed. */
  public start(): void {
    if (this.isRunning || this.isDestroyed) {
      return;
    }
    this.lastTimestampMs = null;
    this.handle = this.scheduler.request(this.onFrame);
  }

  /** Cancels the pending frame; the accumulator keeps its remainder for the next start. */
  public stop(): void {
    if (this.handle !== null) {
      this.scheduler.cancel(this.handle);
      this.handle = null;
    }
  }

  /** Stops for good; `start` does nothing afterwards. */
  public destroy(): void {
    this.stop();
    this.isDestroyed = true;
  }

  private readonly onFrame = (timestampMs: number): void => {
    this.handle = this.scheduler.request(this.onFrame);
    const { tickMs, maxFrameMs } = this.options;
    const elapsedMs = this.lastTimestampMs === null ? 0 : timestampMs - this.lastTimestampMs;
    this.lastTimestampMs = timestampMs;
    this.accumulatorMs += Math.min(Math.max(elapsedMs, 0), maxFrameMs);

    while (this.accumulatorMs >= tickMs - TICK_EPSILON_MS) {
      this.target.tick();
      this.accumulatorMs = Math.max(0, this.accumulatorMs - tickMs);
    }
    this.target.render(this.accumulatorMs / tickMs);
  };
}
