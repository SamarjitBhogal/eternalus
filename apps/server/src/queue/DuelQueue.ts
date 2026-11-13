import type { ClientConnection } from '../transport/ClientConnection.types';
import type { DuelPlayer, MatchStarter } from './DuelQueue.types';

/**
 * The Duel queue (ADR 0016 point 2, DEC-36): the first player waits, the next one is paired with
 * them at once, so at most one connection ever waits. The pair goes to a `MatchStarter`, which
 * tells both players `match-found` once the Duel exists.
 */
export class DuelQueue {
  private waiting: DuelPlayer | null = null;

  public constructor(private readonly starter: MatchStarter) {}

  /** Queues `connection` as `name`: it waits, or is paired with the waiting player. Joining twice does nothing. */
  public join(connection: ClientConnection, name: string): void {
    if (this.waiting?.connection === connection) return;
    const first = this.waiting;
    if (first === null) {
      this.waiting = { connection, name };
      connection.send({ type: 'queue-waiting' });
      return;
    }
    this.waiting = null;
    // ponytail: sides go by arrival order; the owner's answer to plan question 45 may change it.
    this.starter.start(first, { connection, name });
  }

  /** Whether `connection` is the waiting player. */
  public isWaiting(connection: ClientConnection): boolean {
    return this.waiting?.connection === connection;
  }

  /** Hands the waiting slot of `from` to `to` (a reconnect) and tells `to` it waits; does nothing if `from` is not waiting. */
  public replace(from: ClientConnection, to: ClientConnection): void {
    if (this.waiting?.connection !== from) return;
    this.waiting = { connection: to, name: this.waiting.name };
    to.send({ type: 'queue-waiting' });
  }

  /** Removes `connection` if it waits; used by `queue-leave` and on disconnect. */
  public leave(connection: ClientConnection): void {
    if (this.waiting?.connection === connection) this.waiting = null;
  }
}
