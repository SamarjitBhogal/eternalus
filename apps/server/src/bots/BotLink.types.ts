import type { ClientMessage, ServerMessage } from '@eternalus/protocol';

/** One open connection to the Duel server, as a bot uses it. */
export type BotLink = {
  send(message: ClientMessage): void;
  close(): void;
};

/** What a bot hears from its connection. */
export type BotLinkHandlers = {
  onOpen(): void;
  onMessage(message: ServerMessage): void;
  onError(): void;
};

/** Opens connections: Node's `WebSocket` in production, a fake in tests. */
export type BotLinkFactory = {
  open(url: string, handlers: BotLinkHandlers): BotLink;
};
