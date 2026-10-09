import { describe, expect, it } from 'vitest';

import { FakeSessionClock } from './FakeSessionClock';
import { describeSessionClock } from './SessionClock.contract';

describeSessionClock('FakeSessionClock', () => {
  const clock = new FakeSessionClock();
  return {
    clock,
    advance: (ms) => {
      clock.advance(ms);
    },
    dispose: () => undefined,
  };
});

describe('FakeSessionClock', () => {
  it('runs callbacks scheduled by a callback within the same advance, at their own time', () => {
    const clock = new FakeSessionClock();
    const seen: number[] = [];
    clock.schedule(() => {
      seen.push(clock.now());
      clock.schedule(() => seen.push(clock.now()), 400);
    }, 100);
    clock.advance(1000);
    expect(seen).toEqual([100, 500]);
    expect(clock.now()).toBe(1000);
  });

  it('runs ties in scheduling order', () => {
    const clock = new FakeSessionClock();
    const order: string[] = [];
    clock.schedule(() => order.push('first'), 50);
    clock.schedule(() => order.push('second'), 50);
    clock.advance(50);
    expect(order).toEqual(['first', 'second']);
  });

  it('lets a callback cancel a later one due in the same advance', () => {
    const clock = new FakeSessionClock();
    const order: string[] = [];
    let cancelLater = (): void => undefined;
    clock.schedule(() => {
      order.push('first');
      cancelLater();
    }, 10);
    cancelLater = clock.schedule(() => order.push('later'), 20);
    clock.advance(100);
    expect(order).toEqual(['first']);
  });
});
