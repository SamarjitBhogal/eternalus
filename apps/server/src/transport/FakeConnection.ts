import type { ServerMessage } from '@eternalus/protocol';
import type { ClientConnection } from './ClientConnection.types';

/** A `ClientConnection` for tests: records what is sent and lets a test play the client. */
export class FakeConnection implements ClientConnection {
  /** Every message sent to this client, oldest first. */
  public readonly sent: ServerMessage[] = [];
  /** Whether `close()` was called. */
  public isClosed = false;
  /** Whether `terminate()` was called. */
  public isTerminated = false;
  /** How many pings were sent. */
  public pings = 0;
  private readonly pongHandlers: (() => void)[] = [];
  private readonly messageHandlers: ((raw: string) => void)[] = [];
  private readonly closeHandlers: (() => void)[] = [];

  /** Records `message`. */
  public send(message: ServerMessage): void {
    this.sent.push(message);
  }

  /** Marks the connection closed and runs the close handlers once. */
  public close(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.closeHandlers.forEach((handler) => {
      handler();
    });
  }

  /** Counts a ping. */
  public ping(): void {
    this.pings += 1;
  }

  /** Marks the connection terminated, then closed. */
  public terminate(): void {
    this.isTerminated = true;
    this.close();
  }

  /** Registers a pong handler. */
  public onPong(handler: () => void): void {
    this.pongHandlers.push(handler);
  }

  /** Test helper: the client answers a ping. */
  public pong(): void {
    this.pongHandlers.forEach((handler) => {
      handler();
    });
  }

  /** Registers a message handler. */
  public onMessage(handler: (raw: string) => void): void {
    this.messageHandlers.push(handler);
  }

  /** Registers a close handler. */
  public onClose(handler: () => void): void {
    this.closeHandlers.push(handler);
  }

  /** Test helper: the client sends `raw`. */
  public receive(raw: string): void {
    this.messageHandlers.forEach((handler) => {
      handler(raw);
    });
  }

  /** The sent messages of one `type`. */
  public sentOfType<T extends ServerMessage['type']>(
    type: T,
  ): Extract<ServerMessage, { type: T }>[] {
    return this.sent.filter(
      (message): message is Extract<ServerMessage, { type: T }> => message.type === type,
    );
  }
}
