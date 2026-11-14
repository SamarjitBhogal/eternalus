import type { TickScheduler } from '../time/TickScheduler.types';
import type { ClientConnection } from './ClientConnection.types';

/**
 * The connection heartbeat (ADR 0016 point 7): pings every watched connection on each interval
 * and terminates one that did not pong since its last ping, so a half-open socket cannot stay
 * in the queue and be paired.
 */
export class ConnectionHeartbeat {
  private readonly awaitingPong = new Map<ClientConnection, boolean>();

  public constructor(
    private readonly scheduler: TickScheduler,
    private readonly intervalMs: number,
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
    });
  }

  private beat(): void {
    for (const [connection, isAwaiting] of [...this.awaitingPong]) {
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
