import { describe, expect, it } from 'vitest';

import { FakeFrameScheduler } from './FakeFrameScheduler';

describe('FakeFrameScheduler', () => {
  it('fires the pending frame once, with the advanced time', () => {
    const scheduler = new FakeFrameScheduler(100);
    const stamps: number[] = [];
    scheduler.request((t) => stamps.push(t));

    scheduler.advance(16);
    scheduler.advance(16);

    expect(stamps).toEqual([116]);
    expect(scheduler.hasPendingFrame).toBe(false);
  });

  it('cancels only the matching pending frame', () => {
    const scheduler = new FakeFrameScheduler();
    const first = scheduler.request(() => undefined);
    const second = scheduler.request(() => undefined);

    scheduler.cancel(first);
    expect(scheduler.hasPendingFrame).toBe(true);
    scheduler.cancel(second);
    expect(scheduler.hasPendingFrame).toBe(false);
  });

  it('runs a number of frames a fixed time apart', () => {
    const scheduler = new FakeFrameScheduler();
    const stamps: number[] = [];
    const again = (t: number): void => {
      stamps.push(t);
      scheduler.request(again);
    };
    scheduler.request(again);

    scheduler.runFrames(3, 10);

    expect(stamps).toEqual([10, 20, 30]);
  });
});
