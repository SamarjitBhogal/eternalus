import type { ServerMessage } from '@eternalus/protocol';
import { FORWARDED_FOR_HEADER } from '../transport/ClientAddress.constants';
import { BYTE_RANGE, SPREAD_ADDRESS_PREFIX } from './WebSocketBotLinkFactory.constants';
import type { BotLink, BotLinkFactory, BotLinkHandlers } from './BotLink.types';

/**
 * The production `BotLinkFactory`: Node's built-in `WebSocket` (not `ws`, which only the server's
 * listener may import). Messages are trusted: it is a dev tool that talks to our own server.
 */
export class WebSocketBotLinkFactory implements BotLinkFactory {
  private opened = 0;

  /** Opens a socket to `url`; messages that are not JSON are dropped. */
  public open(url: string, handlers: BotLinkHandlers): BotLink {
    this.opened += 1;
    // Every socket gets its own made-up address, in every mode and to any URL. The server trusts
    // X-Forwarded-For only from a loopback peer, so it spreads the per-address cap only there.
    const socket = new WebSocket(url, {
      headers: { [FORWARDED_FOR_HEADER]: this.addressOf(this.opened) },
    });
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

  private addressOf(index: number): string {
    return `${SPREAD_ADDRESS_PREFIX}.${String(Math.floor(index / BYTE_RANGE) % BYTE_RANGE)}.${String(index % BYTE_RANGE)}`;
  }
}
