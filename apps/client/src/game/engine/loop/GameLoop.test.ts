import { describe, expect, it } from 'vitest';

import { FakeFrameScheduler } from './FakeFrameScheduler';
import { GameLoop } from './GameLoop';
import type { LoopTarget } from './GameLoop.types';

const TICK_MS = 1000 / 30;

/** Counts ticks and keeps every render alpha. */
class RecordingTarget implements LoopTarget {
  public ticks = 0;

  public readonly alphas: number[] = [];

  public tick(): void {
    this.ticks += 1;
  }

  public render(alpha: number): void {
    this.alphas.push(alpha);
  }
}

/** A running loop whose first frame has already fired (it only sets the time origin). */
const runningLoop = (): {
  scheduler: FakeFrameScheduler;
  target: RecordingTarget;
  loop: GameLoop;
} => {
  const scheduler = new FakeFrameScheduler();
  const target = new RecordingTarget();
  const loop = new GameLoop(scheduler, target, { tickMs: TICK_MS, maxFrameMs: 5 * TICK_MS });
  loop.start();
  scheduler.advance(0);
  return { scheduler, target, loop };
};

describe('GameLoop', () => {
  it('runs 3 ticks for 100 ms of frames, whatever the frame rate', () => {
    for (const frameMs of [100, 50, 20, 10]) {
      const { scheduler, target } = runningLoop();

      scheduler.runFrames(100 / frameMs, frameMs);

      expect(target.ticks).toBe(3);
    }
  });

  it('clamps a 1 s gap (a tab back from the background) to 5 ticks', () => {
    const { scheduler, target } = runningLoop();

    scheduler.advance(1000);

    expect(target.ticks).toBe(5);
  });

  it('renders once per frame with alpha in [0, 1) for the time between ticks', () => {
    const { scheduler, target } = runningLoop();

    scheduler.runFrames(7, 16.7);

    expect(target.alphas).toHaveLength(8);
    expect(target.alphas.every((alpha) => alpha >= 0 && alpha < 1)).toBe(true);
    expect(target.alphas[1]).toBeCloseTo(16.7 / TICK_MS);
  });

  it('measures the first frame from itself, so it never runs a tick', () => {
    const scheduler = new FakeFrameScheduler(5000);
    const target = new RecordingTarget();
    new GameLoop(scheduler, target, { tickMs: TICK_MS, maxFrameMs: 5 * TICK_MS }).start();

    scheduler.advance(10);

    expect(target.ticks).toBe(0);
    expect(target.alphas).toEqual([0]);
  });

  it('stops, keeps its remainder, and starts again without counting the pause', () => {
    const { scheduler, target, loop } = runningLoop();
    scheduler.advance(TICK_MS * 1.5);
    expect(target.ticks).toBe(1);

    loop.stop();
    expect(loop.isRunning).toBe(false);
    scheduler.advance(10_000);
    expect(target.ticks).toBe(1);

    loop.start();
    scheduler.advance(0);
    scheduler.advance(TICK_MS * 0.5);
    expect(target.ticks).toBe(2);
  });

  it('never starts twice and never starts after destroy', () => {
    const { scheduler, target, loop } = runningLoop();
    loop.start();
    expect(loop.isRunning).toBe(true);

    loop.destroy();
    loop.start();

    expect(loop.isRunning).toBe(false);
    expect(scheduler.hasPendingFrame).toBe(false);
    scheduler.advance(1000);
    expect(target.ticks).toBe(0);
  });

  it('ignores a timestamp that goes backwards', () => {
    const { scheduler, target } = runningLoop();

    scheduler.advance(-50);

    expect(target.ticks).toBe(0);
    expect(target.alphas.at(-1)).toBe(0);
  });

  it('refuses a non-positive tick or a clamp shorter than a tick', () => {
    const scheduler = new FakeFrameScheduler();
    const target = new RecordingTarget();

    expect(() => new GameLoop(scheduler, target, { tickMs: 0, maxFrameMs: 10 })).toThrow(
      RangeError,
    );
    expect(() => new GameLoop(scheduler, target, { tickMs: 10, maxFrameMs: 5 })).toThrow(
      'GameLoop needs tickMs > 0 and maxFrameMs >= tickMs, got 10 and 5.',
    );
  });
});
