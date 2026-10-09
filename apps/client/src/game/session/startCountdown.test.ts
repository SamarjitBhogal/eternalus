import { describe, expect, it } from 'vitest';

import { FakeSessionClock } from '../engine/time/FakeSessionClock';
import type { SessionClock } from '../engine/time/SessionClock.types';
import { startCountdown } from './startCountdown';

function run(clock: SessionClock, durationMs: number) {
  const ticks: number[] = [];
  let doneCount = 0;
  const stop = startCountdown(
    clock,
    durationMs,
    (ms) => ticks.push(ms),
    () => {
      doneCount += 1;
    },
  );
  return { ticks, stop, done: () => doneCount };
}

describe('startCountdown', () => {
  it('reports the full time at once, then every second down to zero, then finishes once', () => {
    const clock = new FakeSessionClock();
    const { ticks, done } = run(clock, 3_000);
    expect(ticks).toEqual([3_000]);
    clock.advance(10_000);
    expect(ticks).toEqual([3_000, 2_000, 1_000, 0]);
    expect(done()).toBe(1);
  });

  it('realigns to whole seconds when a timer fires late', () => {
    let now = 0;
    const queue: { at: number; run: () => void }[] = [];
    const lateClock: SessionClock = {
      now: () => now,
      schedule: (callback, delayMs) => {
        queue.push({ at: now + delayMs, run: callback });
        return () => undefined;
      },
    };
    const { ticks } = run(lateClock, 3_000);
    const fireLate = (lateByMs: number) => {
      const timer = queue.shift();
      if (timer === undefined) throw new Error('nothing scheduled');
      now = timer.at + lateByMs;
      timer.run();
    };
    fireLate(250);
    fireLate(0);
    fireLate(0);
    expect(ticks).toEqual([3_000, 1_750, 1_000, 0]);
  });

  it('stops without finishing', () => {
    const clock = new FakeSessionClock();
    const { ticks, stop, done } = run(clock, 3_000);
    clock.advance(1_000);
    stop();
    clock.advance(10_000);
    expect(ticks).toEqual([3_000, 2_000]);
    expect(done()).toBe(0);
  });
});
