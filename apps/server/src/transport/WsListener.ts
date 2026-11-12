import { WebSocketServer } from 'ws';
import type { ConnectionLimiter } from '../limits/ConnectionLimiter';
import { ClientAddress } from './ClientAddress';
import type { ClientConnection } from './ClientConnection.types';
import { MAX_WS_PAYLOAD_BYTES, WS_TRY_AGAIN_LATER } from './WsListener.constants';
import type { WsListenerOptions } from './WsListener.types';
import { WsConnection } from './WsConnection';

/**
 * Accepts WebSocket clients and hands each over as a `ClientConnection` (ADR 0016 point 3). A
 * client past the connection caps is refused here, before anything else sees it (point 7). The
 * only file that imports `ws`.
 */
export class WsListener {
  private server: WebSocketServer | null = null;
  private readonly address = new ClientAddress();

  public constructor(
    private readonly options: WsListenerOptions,
    private readonly limiter: ConnectionLimiter,
  ) {}

  /** Starts listening; `onConnection` gets every client that connects. */
  public listen(onConnection: (connection: ClientConnection) => void): void {
    const server = new WebSocketServer({ ...this.options, maxPayload: MAX_WS_PAYLOAD_BYTES });
    server.on('connection', (socket, request) => {
      const ip = this.address.resolve(request.socket.remoteAddress, request.headers);
      if (!this.limiter.tryAcquire(ip)) {
        // The closing handshake is still open: a bad frame in it emits `error`, and an
        // unhandled `error` would end the process.
        socket.on('error', () => {
          socket.terminate();
        });
        socket.close(WS_TRY_AGAIN_LATER);
        return;
      }
      socket.on('close', () => {
        this.limiter.release(ip);
      });
      onConnection(new WsConnection(socket));
    });
    this.server = server;
  }

  /** Stops accepting clients and closes the open sockets; resolves once every socket is closed. */
  public close(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (server === null) return Promise.resolve();
    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
      server.clients.forEach((socket) => {
        socket.close();
      });
    });
  }
}
