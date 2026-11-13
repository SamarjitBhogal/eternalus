import type { ServerMessage } from '@eternalus/protocol';
import type { BotLink, BotLinkFactory, BotLinkHandlers } from './BotLink.types';

/**
 * The production `BotLinkFactory`: Node's built-in `WebSocket` (not `ws`, which only the server's
 * listener may import). Messages are trusted: it is a dev tool that talks to our own server.
 */
export class WebSocketBotLinkFactory implements BotLinkFactory {
  /** Opens a socket to `url`; messages that are not JSON are dropped. */
  public open(url: string, handlers: BotLinkHandlers): BotLink {
    const socket = new WebSocket(url);
    socket.addEventListener('open', () => {
      handlers.onOpen();
    });
    socket.addEventListener('message', (event: MessageEvent) => {
      handlers.onMessage(JSON.parse(String(event.data)) as ServerMessage);
    });
    socket.addEventListener('error', () => {
      handlers.onError();
    });
    return {
      send: (message) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(message));
        }
      },
      close: () => {
        socket.close();
      },
    };
  }
}
