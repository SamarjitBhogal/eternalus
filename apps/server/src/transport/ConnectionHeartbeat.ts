import type { TickScheduler } from '../time/TickScheduler.types';
import type { ClientConnection } from './ClientConnection.types';

/**
 * The connection heartbeat (ADR 0016 point 7): pings every watched connection on each interval
 * and terminates one that did not pong since its last ping, so a half-open socket cannot stay
 * in the queue and be paired. `probe` checks one connection at once, on a shorter deadline.
 */
export class ConnectionHeartbeat {
  private readonly awaitingPong = new Map<ClientConnection, boolean>();
  /** Connections under a `probe`: the regular beat leaves them to it. */
  private readonly probing = new Set<ClientConnection>();

  public constructor(
    private readonly scheduler: TickScheduler,
    private readonly intervalMs: number,
    private readonly probeTimeoutMs: number,
  ) {}

  /** Starts the interval; returns what stops it. */
  public start(): () => void {
    return this.scheduler.every(this.intervalMs, () => {
      this.beat();
    });
  }

  /** Watches `connection` until it closes. */
  public watch(connection: ClientConnection): void {
    this.awaitingPong.set(connection, false);
    connection.onPong(() => {
      if (this.awaitingPong.has(connection)) this.awaitingPong.set(connection, false);
    });
    connection.onClose(() => {
      this.awaitingPong.delete(connection);
      this.probing.delete(connection);
    });
  }

  /**
   * Checks `connection` now instead of on a later beat: pings it and terminates it unless it pongs
   * within the probe timeout. A reconnect that presents the id of a seat whose socket still looks
   * open calls this (DEC-349): a half-open socket is closed in time for the next retry to take the
   * seat over, and a live one, which answers, keeps it. Does nothing for an unwatched connection
   * or one already being probed.
   */
  public probe(connection: ClientConnection): void {
    if (!this.awaitingPong.has(connection) || this.probing.has(connection)) return;
    this.probing.add(connection);
    this.awaitingPong.set(connection, true);
    connection.ping();
    const cancel = this.scheduler.every(this.probeTimeoutMs, () => {
      cancel();
      this.probing.delete(connection);
      if (this.awaitingPong.get(connection) !== true) return;
      this.awaitingPong.delete(connection);
      connection.terminate();
    });
  }

  private beat(): void {
    for (const [connection, isAwaiting] of [...this.awaitingPong]) {
      if (this.probing.has(connection)) continue;
      if (isAwaiting) {
        this.awaitingPong.delete(connection);
        connection.terminate();
      } else {
        this.awaitingPong.set(connection, true);
        connection.ping();
      }
    }
  }
}
