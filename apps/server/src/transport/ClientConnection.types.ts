import type { ServerMessage } from '@eternalus/protocol';

/**
 * One client's connection, as the server sees it (ADR 0016 point 3): the transport port. The
 * `ws` adapter is its production implementation; tests use `FakeConnection`. Nothing above it
 * knows the wire.
 */
export interface ClientConnection {
  /** Sends `message` to the client; does nothing once the connection is closed. Never throws. */
  send(message: ServerMessage): void;
  /** Closes the connection; `onClose` handlers still run once. */
  close(): void;
  /** Sends a heartbeat ping (ADR 0016 point 7); does nothing once the connection is closed. */
  ping(): void;
  /** Drops the connection at once, with no closing handshake; `onClose` handlers still run once. */
  terminate(): void;
  /** Registers the handler for each pong the client answers a ping with. */
  onPong(handler: () => void): void;
  /** Registers the handler for each raw text message the client sends. */
  onMessage(handler: (raw: string) => void): void;
  /** Registers the handler that runs once when the connection closes, from either side. */
  onClose(handler: () => void): void;
}
