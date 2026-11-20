import type { ServerMessage } from '@eternalus/protocol';

/** What a `MessageTransport` calls back with; both run outside any tick, on the network's turn. */
export type TransportHandlers = {
  /** One decoded server message. Messages the transport cannot decode are dropped before this. */
  readonly onMessage: (message: ServerMessage) => void;
  /**
   * The connection ended because the server or the network closed it or never opened it. Never
   * called after the owner's own `close()`.
   */
  readonly onClose: () => void;
};
