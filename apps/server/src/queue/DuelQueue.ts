import type { ClientConnection } from '../transport/ClientConnection.types';
import type { MatchStarter } from './DuelQueue.types';

/**
 * The Duel queue (ADR 0016 point 2, DEC-36): the first player waits, the next one is paired with
 * them at once, so at most one connection ever waits. The pair goes to a `MatchStarter`, which
 * tells both players `match-found` once the Duel exists.
 */
export class DuelQueue {
  private waiting: ClientConnection | null = null;

  public constructor(private readonly starter: MatchStarter) {}

  /** Queues `connection`: it waits, or is paired with the waiting player. Joining twice does nothing. */
  public join(connection: ClientConnection): void {
    if (this.waiting === connection) return;
    const first = this.waiting;
    if (first === null) {
      this.waiting = connection;
      connection.send({ type: 'queue-waiting' });
      return;
    }
    this.waiting = null;
    // ponytail: sides go by arrival order; the owner's answer to plan question 45 may change it.
    this.starter.start(first, connection);
  }

  /** Removes `connection` if it waits; used by `queue-leave` and on disconnect. */
  public leave(connection: ClientConnection): void {
    if (this.waiting === connection) this.waiting = null;
  }
}
