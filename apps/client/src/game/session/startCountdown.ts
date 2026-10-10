import type { SessionClock } from '../engine/time/SessionClock.types';
import { COUNTDOWN_STEP_MS } from './sessionTiming.constants';

/**
 * Counts `durationMs` down on `clock`: reports the remaining time now and on every whole step,
 * then calls `onDone` once at zero. The remaining time is read from `clock.now()`, so a late
 * timer never accumulates drift.
 * @returns A function that stops the countdown.
 */
export function startCountdown(
  clock: SessionClock,
  durationMs: number,
  onTick: (remainingMs: number) => void,
  onDone: () => void,
): () => void {
  const endsAt = clock.now() + durationMs;
  let cancel = (): void => undefined;
  const tick = (): void => {
    const remainingMs = Math.max(0, endsAt - clock.now());
    onTick(remainingMs);
    if (remainingMs === 0) {
      onDone();
      return;
    }
    cancel = clock.schedule(tick, remainingMs % COUNTDOWN_STEP_MS || COUNTDOWN_STEP_MS);
  };
  tick();
  return () => {
    cancel();
  };
}
