import { ClientMessageParser, type ClientMessage } from '@eternalus/protocol';
import type { TokenBucket } from '../limits/TokenBucket';
import type { DuelHost } from '../match/DuelHost';
import type { DuelQueue } from '../queue/DuelQueue';
import type { ClientConnection } from '../transport/ClientConnection.types';

/**
 * The gateway (ADR 0016 points 2 and 7): the trust boundary for each connection. Every raw
 * message is rate-limited, parsed by `ClientMessageParser` and routed to the queue or the
 * connection's match; a bad one gets `rejected` and nothing else. Never throws.
 */
export class DuelGateway {
  /**
   * @param newLimiter Makes one message-rate limiter per connection.
   */
  public constructor(
    private readonly parser: ClientMessageParser,
    private readonly queue: DuelQueue,
    private readonly host: DuelHost,
    private readonly newLimiter: () => TokenBucket,
  ) {}

  /** Takes over a new connection. */
  public accept(connection: ClientConnection): void {
    const limiter = this.newLimiter();
    connection.onMessage((raw) => {
      this.handle(connection, limiter, raw);
    });
    connection.onClose(() => {
      this.queue.leave(connection);
      this.host.leave(connection);
    });
  }

  private handle(connection: ClientConnection, limiter: TokenBucket, raw: string): void {
    if (!limiter.tryTake()) {
      connection.send({ type: 'rejected', reason: 'rate-limited' });
      return;
    }
    const parsed = this.parser.parse(raw);
    if (!parsed.ok) {
      connection.send({ type: 'rejected', reason: parsed.reason });
      return;
    }
    this.route(connection, parsed.message);
  }

  private route(connection: ClientConnection, message: ClientMessage): void {
    switch (message.type) {
      case 'queue-join':
        if (this.host.isInMatch(connection))
          connection.send({ type: 'rejected', reason: 'in-match' });
        else this.queue.join(connection);
        return;
      case 'queue-leave':
        if (this.host.isInMatch(connection))
          connection.send({ type: 'rejected', reason: 'in-match' });
        else this.queue.leave(connection);
        return;
      case 'intent':
        if (!this.host.submit(connection, message.seq, message.intent)) {
          connection.send({ type: 'rejected', reason: 'not-in-match' });
        }
        return;
    }
  }
}
