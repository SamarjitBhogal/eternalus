import { vi } from 'vitest';

import { PerformanceSessionClock } from './PerformanceSessionClock';
import { describeSessionClock } from './SessionClock.contract';

// Vitest's fake timers drive setTimeout and performance.now, so no real time passes.
describeSessionClock('PerformanceSessionClock', () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  return {
    clock: new PerformanceSessionClock(),
    advance: (ms) => vi.advanceTimersByTime(ms),
    dispose: () => vi.useRealTimers(),
  };
});
