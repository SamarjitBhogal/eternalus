import type { FrameCallback, FrameHandle, FrameScheduler } from './FrameScheduler.types';
import type { AnimationFrameApi } from './RafFrameScheduler.types';

/** The browser's frames: one callback per display refresh through `requestAnimationFrame`. */
export class RafFrameScheduler implements FrameScheduler {
  /** Creates a scheduler over the browser's animation-frame functions. */
  public constructor(private readonly api: AnimationFrameApi) {}

  /** Calls `callback` on the next display refresh. */
  public request(callback: FrameCallback): FrameHandle {
    return this.api.requestAnimationFrame(callback);
  }

  /** Cancels a pending frame. */
  public cancel(handle: FrameHandle): void {
    this.api.cancelAnimationFrame(handle);
  }
}
