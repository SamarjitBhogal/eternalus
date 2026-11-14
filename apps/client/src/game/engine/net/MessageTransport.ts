import type { ClientMessage } from '@eternalus/protocol';

import type { TransportHandlers } from './MessageTransport.types';

/**
 * The client's one door to the Duel server (ADR 0016 point 3; recipe R25): typed messages in and
 * out, no socket in sight. The browser adapter is `WebSocketTransport`; tests use
 * `FakeMessageTransport`. One transport is one connection: build a new one to reconnect.
 */
export interface MessageTransport {
  /** Starts connecting and routes what arrives to `handlers`; call once. */
  connect(handlers: TransportHandlers): void;
  /**
   * Sends `message` in call order. A message sent before the connection is open waits for it; one
   * sent after the connection ended is dropped.
   */
  send(message: ClientMessage): void;
  /** Ends the connection; afterwards nothing is delivered and `onClose` is not called. Safe twice. */
  close(): void;
}
