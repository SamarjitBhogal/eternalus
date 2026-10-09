import { describe, expect, it } from 'vitest';

import type { FrameCallback } from './FrameScheduler.types';
import { RafFrameScheduler } from './RafFrameScheduler';

describe('RafFrameScheduler', () => {
  it('requests and cancels through the browser animation-frame functions', () => {
    const requested: FrameCallback[] = [];
    const cancelled: number[] = [];
    const scheduler = new RafFrameScheduler({
      requestAnimationFrame: (callback) => requested.push(callback),
      cancelAnimationFrame: (handle) => cancelled.push(handle),
    });
    const callback: FrameCallback = () => undefined;

    const handle = scheduler.request(callback);
    scheduler.cancel(handle);

    expect(requested).toEqual([callback]);
    expect(cancelled).toEqual([1]);
  });
});
