import { afterEach, describe, expect, it } from 'vitest';

import type { SessionClock } from './SessionClock.types';

/** What the contract suite needs from each adapter: the clock and a way to move its time. */
export type SessionClockHarness = {
  readonly clock: SessionClock;
  readonly advance: (ms: number) => void;
  readonly dispose: () => void;
};

/**
 * The behaviour every `SessionClock` adapter must share (LSP). Each adapter's test file calls
 * this with a factory that controls that adapter's time source.
 */
export function describeSessionClock(name: string, createHarness: () => SessionClockHarness): void {
  describe(`SessionClock contract: ${name}`, () => {
    let harness: SessionClockHarness | undefined;
    const setUp = (): SessionClockHarness => (harness = createHarness());
    afterEach(() => harness?.dispose());

    it('now() moves forward by the advanced time', () => {
      const { clock, advance } = setUp();
      const start = clock.now();
      advance(250);
      expect(clock.now() - start).toBe(250);
    });

    it('runs a scheduled callback once its delay has passed, not before', () => {
      const { clock, advance } = setUp();
      const runs: number[] = [];
      clock.schedule(() => runs.push(clock.now()), 1000);
      advance(999);
      expect(runs).toHaveLength(0);
      advance(1);
      expect(runs).toHaveLength(1);
      advance(5000);
      expect(runs).toHaveLength(1);
    });

    it('runs callbacks in due order', () => {
      const { clock, advance } = setUp();
      const order: string[] = [];
      clock.schedule(() => order.push('late'), 300);
      clock.schedule(() => order.push('early'), 100);
      advance(300);
      expect(order).toEqual(['early', 'late']);
    });

    it('never runs a cancelled callback', () => {
      const { clock, advance } = setUp();
      const runs: string[] = [];
      const cancel = clock.schedule(() => runs.push('cancelled'), 100);
      cancel();
      advance(200);
      expect(runs).toEqual([]);
    });
  });
}
