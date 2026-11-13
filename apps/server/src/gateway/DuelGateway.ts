import type { ClientMessage } from '@eternalus/protocol';
import type { TokenBucket } from '../limits/TokenBucket';
import type { ClientConnection } from '../transport/ClientConnection.types';
import type { DuelGatewayOptions } from './DuelGateway.types';

/**
 * The gateway (ADR 0016 points 2 and 7): the trust boundary for each connection. Every raw
 * message is rate-limited, parsed by `ClientMessageParser` and routed to the queue or the
 * connection's match; a bad one gets `rejected` and nothing else. Never throws.
 * Each connection is a guest (`PresenceBook`): it is closed or held there, not here.
 */
export class DuelGateway {
  public constructor(private readonly options: DuelGatewayOptions) {}

  /** Takes over a new connection. */
  public accept(connection: ClientConnection): void {
    const limiter = this.options.newLimiter();
    this.options.presence.connect(connection);
    connection.onMessage((raw) => {
      this.handle(connection, limiter, raw);
    });
    connection.onClose(() => {
      this.options.presence.disconnect(connection);
    });
  }

  private handle(connection: ClientConnection, limiter: TokenBucket, raw: string): void {
    if (!limiter.tryTake()) {
      connection.send({ type: 'rejected', reason: 'rate-limited' });
      return;
    }
    const parsed = this.options.parser.parse(raw);
    if (!parsed.ok) {
      connection.send({ type: 'rejected', reason: parsed.reason });
      return;
    }
    this.route(connection, parsed.message);
  }

  private route(connection: ClientConnection, message: ClientMessage): void {
    const { queue, host, presence } = this.options;
    switch (message.type) {
      case 'queue-join':
        // A reconnect takes over its held slot and is told its state: nothing more to do.
        if (message.guestId !== undefined && presence.resume(connection, message.guestId)) return;
        if (host.isInMatch(connection)) connection.send({ type: 'rejected', reason: 'in-match' });
        else queue.join(connection, message.name);
        return;
      case 'queue-leave':
        if (host.isInMatch(connection)) connection.send({ type: 'rejected', reason: 'in-match' });
        else queue.leave(connection);
        return;
      case 'forfeit':
        if (host.isInMatch(connection)) host.leave(connection);
        else connection.send({ type: 'rejected', reason: 'not-in-match' });
        return;
      case 'intent':
        if (!host.submit(connection, message.seq, message.intent)) {
          connection.send({ type: 'rejected', reason: 'not-in-match' });
        }
        return;
    }
  }
}
