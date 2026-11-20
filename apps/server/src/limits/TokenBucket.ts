import type { Clock } from '../time/Clock.types';
import { MS_PER_SECOND } from './TokenBucket.constants';

/**
 * A token bucket: `capacity` tokens at most, refilled at `refillPerSecond`. One per connection
 * limits its message rate (ADR 0016 point 7).
 */
export class TokenBucket {
  private tokens: number;
  private lastMs: number;

  public constructor(
    private readonly clock: Clock,
    private readonly capacity: number,
    private readonly refillPerSecond: number,
  ) {
    this.tokens = capacity;
    this.lastMs = clock.nowMs();
  }

  /** Takes one token; `false` when the bucket is empty, so the message must be refused. */
  public tryTake(): boolean {
    const now = this.clock.nowMs();
    const refill = ((now - this.lastMs) / MS_PER_SECOND) * this.refillPerSecond;
    this.tokens = Math.min(this.capacity, this.tokens + refill);
    this.lastMs = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
