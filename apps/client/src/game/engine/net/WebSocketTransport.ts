import type { ClientMessage } from '@eternalus/protocol';

import type { MessageTransport } from './MessageTransport';
import type { TransportHandlers } from './MessageTransport.types';
import { ServerMessageDecoder } from './ServerMessageDecoder';
import { SOCKET_OPEN } from './WebSocketTransport.constants';
import type { SocketApi, SocketFactory } from './WebSocketTransport.types';

/**
 * The browser's `WebSocket` as a `MessageTransport` (ADR 0016 point 3; R25): the only file that
 * touches the WebSocket API. Messages travel as JSON text; a frame that is not a `ServerMessage`
 * is dropped. Sends made before the socket opens wait and go out in order on open.
 */
export class WebSocketTransport implements MessageTransport {
  private socket: SocketApi | null = null;

  private readonly waiting: string[] = [];

  private readonly decoder = new ServerMessageDecoder();

  /** @param openSocket - Builds the socket; tests pass a fake, the app the browser's. */
  public constructor(
    private readonly url: string,
    private readonly openSocket: SocketFactory = (target) => new WebSocket(target),
  ) {}

  /** Opens the socket and routes its frames and its end to `handlers`. */
  public connect(handlers: TransportHandlers): void {
    const socket = this.openSocket(this.url);
    this.socket = socket;
    socket.onopen = () => {
      for (const text of this.waiting.splice(0)) socket.send(text);
    };
    socket.onmessage = ({ data }) => {
      const message = typeof data === 'string' ? this.decoder.decode(data) : null;
      if (message !== null) handlers.onMessage(message);
    };
    // An error always ends in a close, so only the close is reported.
    socket.onclose = () => {
      this.detach();
      handlers.onClose();
    };
  }

  /** Sends now when open, else after it opens; dropped once the connection ended. */
  public send(message: ClientMessage): void {
    const text = JSON.stringify(message);
    if (this.socket === null) return;
    if (this.socket.readyState === SOCKET_OPEN) {
      this.socket.send(text);
    } else {
      this.waiting.push(text);
    }
  }

  /** Closes the socket without reporting it. */
  public close(): void {
    const { socket } = this;
    this.detach();
    socket?.close();
  }

  private detach(): void {
    if (this.socket !== null) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
    }
    this.socket = null;
    this.waiting.length = 0;
  }
}
