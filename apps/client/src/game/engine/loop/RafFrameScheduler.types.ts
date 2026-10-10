import type { FrameCallback, FrameHandle } from './FrameScheduler.types';

/** The two browser functions the scheduler wraps; injected so tests need no DOM. */
export type AnimationFrameApi = {
  readonly requestAnimationFrame: (callback: FrameCallback) => FrameHandle;
  readonly cancelAnimationFrame: (handle: FrameHandle) => void;
};
