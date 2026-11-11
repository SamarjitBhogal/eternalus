import type { ServerMessage } from '@eternalus/protocol';
import type { ClientConnection } from './ClientConnection.types';
import { WS_OPEN } from './WsConnection.constants';
import type { WsSocketLike } from './WsConnection.types';

/**
 * A `ClientConnection` over one WebSocket (ADR 0016 point 3): JSON text in and out. Binary
 * frames are ignored, so the parser only ever sees text. A socket error closes the connection.
 */
export class WsConnection implements ClientConnection {
  private readonly messageHandlers: ((raw: string) => void)[] = [];
  private readonly closeHandlers: (() => void)[] = [];
  private readonly pongHandlers: (() => void)[] = [];
  private isClosed = false;

  public constructor(private readonly socket: WsSocketLike) {
    socket.on('message', (data, isBinary) => {
      if (!isBinary && !Array.isArray(data) && !(data instanceof ArrayBuffer)) {
        const raw = data.toString('utf8');
        this.messageHandlers.forEach((handler) => {
          handler(raw);
        });
      }
    });
    socket.on('close', () => {
      this.markClosed();
    });
    socket.on('pong', () => {
      this.pongHandlers.forEach((handler) => {
        handler();
      });
    });
    socket.on('error', () => {
      this.close();
    });
  }

  /** Sends `message` as JSON while the socket is open. */
  public send(message: ServerMessage): void {
    if (this.socket.readyState === WS_OPEN) this.socket.send(JSON.stringify(message));
  }

  /** Closes the socket. */
  public close(): void {
    this.socket.close();
    this.markClosed();
  }

  /** Pings the client while the socket is open. */
  public ping(): void {
    if (this.socket.readyState === WS_OPEN) this.socket.ping();
  }

  /** Destroys the socket without a closing handshake, for a peer that stopped answering. */
  public terminate(): void {
    this.socket.terminate();
    this.markClosed();
  }

  /** Registers a pong handler. */
  public onPong(handler: () => void): void {
    this.pongHandlers.push(handler);
  }

  /** Registers a message handler. */
  public onMessage(handler: (raw: string) => void): void {
    this.messageHandlers.push(handler);
  }

  /** Registers a close handler. */
  public onClose(handler: () => void): void {
    this.closeHandlers.push(handler);
  }

  private markClosed(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.closeHandlers.forEach((handler) => {
      handler();
    });
  }
}
