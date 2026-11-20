import type { SocketApi } from './WebSocketTransport.types';

/** A `WebSocket` for tests: a test opens it, feeds frames and closes it by hand. */
export class FakeSocket implements SocketApi {
  /** Frames sent, in order. */
  public readonly sent: string[] = [];

  public readyState = 0;

  public onopen: ((event: Event) => void) | null = null;

  public onmessage: ((event: MessageEvent) => void) | null = null;

  public onclose: ((event: CloseEvent) => void) | null = null;

  /** How many times the client called `close()`. */
  public closeCalls = 0;

  /** The connection opens. */
  public open(): void {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  /** The server sends a frame. */
  public deliver(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  /** The server ends the connection. */
  public end(): void {
    this.readyState = 3;
    this.onclose?.(new CloseEvent('close'));
  }

  /** Records the frame. */
  public send(data: string): void {
    this.sent.push(data);
  }

  /** Counts the call, like a socket that is closing. */
  public close(): void {
    this.closeCalls += 1;
    this.readyState = 2;
  }
}
