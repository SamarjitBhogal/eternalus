import type { ClientMessageParser } from '@eternalus/protocol';
import type { TokenBucket } from '../limits/TokenBucket';
import type { DuelHost } from '../match/DuelHost';
import type { PresenceBook } from '../presence/PresenceBook';
import type { DuelQueue } from '../queue/DuelQueue';

/** What a `DuelGateway` is built from. */
export type DuelGatewayOptions = {
  readonly parser: ClientMessageParser;
  readonly queue: DuelQueue;
  readonly host: DuelHost;
  readonly presence: PresenceBook;
  /** Makes one message-rate limiter per connection. */
  readonly newLimiter: () => TokenBucket;
};
