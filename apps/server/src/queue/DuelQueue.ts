import type { ClientConnection } from '../transport/ClientConnection.types';
import type { CancelTask } from '../time/TickScheduler.types';
import { MS_PER_SECOND } from '../time/time.constants';
import {
  BASE_RATING_GAP,
  GAP_WIDENING_PER_SECOND,
  QUEUE_SWEEP_MS,
  QUEUE_TIMEOUT_MS,
} from './DuelQueue.constants';
import type { DuelQueueOptions, Waiter } from './DuelQueue.types';

/**
 * The Duel queue (ADR 0016 point 2, DEC-36): players wait with their rating and are paired by
 * closest rating. Two players may pair when their rating gap is within the allowed gap of the
 * one who has waited longer: `BASE_RATING_GAP + GAP_WIDENING_PER_SECOND x seconds waited`, with
 * no limit after `QUEUE_TIMEOUT_MS`. The closest pair goes first. Matching runs on every join and
 * on a periodic sweep (`start`). A pair goes to a `MatchStarter`, which tells both `match-found`.
 * A held waiter (disconnected, inside the reconnect window) keeps its place and wait time but is
 * never paired until it comes back.
 *
 * ponytail: ratings live in memory (`PlayerRatings`) as an interim (DEC-297 (3)); FR-118 (ratings
 * kept in a database) is the upgrade, scheduled for sprint 4.
 */
export class DuelQueue {
  private waiting: Waiter[] = [];

  public constructor(private readonly options: DuelQueueOptions) {}

  /** Starts the periodic sweep that re-pairs as the allowed gaps widen. @returns Stops it. */
  public start(): CancelTask {
    return this.options.scheduler.every(QUEUE_SWEEP_MS, () => {
      this.pairUp();
    });
  }

  /** Queues `connection`: it waits (told `queue-waiting`) or is paired at once. Joining twice does nothing. */
  public join(connection: ClientConnection, name: string, guestId: string): void {
    if (this.isWaiting(connection)) return;
    this.waiting.push({
      player: { connection, name, guestId },
      rating: this.options.ratings.get(guestId).rating,
      joinedAtMs: this.options.clock.nowMs(),
      isHeld: false,
    });
    this.pairUp();
    if (this.isWaiting(connection)) connection.send({ type: 'queue-waiting' });
  }

  /** Whether `connection` is waiting. */
  public isWaiting(connection: ClientConnection): boolean {
    return this.waiting.some((waiter) => waiter.player.connection === connection);
  }

  /** `connection` disconnected but its slot is held: it keeps its place and is not paired. */
  public hold(connection: ClientConnection): void {
    const index = this.waiting.findIndex((waiter) => waiter.player.connection === connection);
    const waiter = this.waiting[index];
    if (waiter === undefined) return;
    this.waiting[index] = { ...waiter, isHeld: true };
  }

  /**
   * Hands the waiting slot of `from` to `to` (a reconnect), no longer held, and tells `to` it
   * waits (or pairs it at once); does nothing if `from` is not waiting.
   */
  public replace(from: ClientConnection, to: ClientConnection): void {
    const index = this.waiting.findIndex((waiter) => waiter.player.connection === from);
    const waiter = this.waiting[index];
    if (waiter === undefined) return;
    this.waiting[index] = {
      ...waiter,
      player: { ...waiter.player, connection: to },
      isHeld: false,
    };
    this.pairUp();
    if (this.isWaiting(to)) to.send({ type: 'queue-waiting' });
  }

  /** Removes `connection` if it waits; used by `queue-leave` and on disconnect. */
  public leave(connection: ClientConnection): void {
    this.waiting = this.waiting.filter((waiter) => waiter.player.connection !== connection);
  }

  /** Pairs the closest allowed pair, again and again, until none is allowed. */
  private pairUp(): void {
    const now = this.options.clock.nowMs();
    for (let pair = this.closestAllowed(now); pair !== null; pair = this.closestAllowed(now)) {
      const [first, second] = pair;
      this.waiting = this.waiting.filter((waiter) => waiter !== first && waiter !== second);
      // ponytail: sides go by arrival order; the owner's answer to plan question 45 may change it.
      this.options.starter.start(first.player, second.player);
    }
  }

  // ponytail: scans every pair, O(n^2) per call, and pairUp calls it once per pair, so O(n^3) per sweep; fine for hundreds of waiters, sort by rating beyond that.
  private closestAllowed(now: number): readonly [Waiter, Waiter] | null {
    let best: readonly [Waiter, Waiter] | null = null;
    let bestGap = Infinity;
    const pairable = this.waiting.filter((waiter) => !waiter.isHeld);
    for (const [index, first] of pairable.entries()) {
      for (const second of pairable.slice(index + 1)) {
        const gap = Math.abs(first.rating - second.rating);
        if (gap < bestGap && gap <= this.allowedGap(first, second, now)) {
          best = [first, second];
          bestGap = gap;
        }
      }
    }
    return best;
  }

  /** The gap the pair allows: that of whichever of the two has waited longer. */
  private allowedGap(first: Waiter, second: Waiter, now: number): number {
    const waitedMs = now - Math.min(first.joinedAtMs, second.joinedAtMs);
    if (waitedMs >= QUEUE_TIMEOUT_MS) return Infinity;
    return BASE_RATING_GAP + (GAP_WIDENING_PER_SECOND * waitedMs) / MS_PER_SECOND;
  }
}
