import type { ClientMessage, ServerMessage } from '@eternalus/protocol';

import type { MessageTransport } from './MessageTransport';
import type { TransportHandlers } from './MessageTransport.types';

/**
 * Test double of the Duel server's door (02 §8): records what the client sends and lets a test
 * play the server (`receive`, `drop`). Nothing is asynchronous and no socket exists.
 */
export class FakeMessageTransport implements MessageTransport {
  /** Every message sent while connected, in order. */
  public readonly sent: ClientMessage[] = [];

  private handlers: TransportHandlers | null = null;

  private isClosed = false;

  /** Whether `connect` was called. */
  public get isConnected(): boolean {
    return this.handlers !== null && !this.isClosed;
  }

  /** Whether `close()` was called or the server dropped the connection. */
  public get hasEnded(): boolean {
    return this.isClosed;
  }

  /** Keeps `handlers` to deliver to. */
  public connect(handlers: TransportHandlers): void {
    this.handlers = handlers;
  }

  /** Records `message` unless the connection ended. */
  public send(message: ClientMessage): void {
    if (!this.isClosed) this.sent.push(message);
  }

  /** Ends the connection without telling the handlers. */
  public close(): void {
    this.isClosed = true;
  }

  /** Plays the server sending `message`; ignored once the connection ended. */
  public receive(message: ServerMessage): void {
    if (!this.isClosed) this.handlers?.onMessage(message);
  }

  /** Plays the server (or network) ending the connection. */
  public drop(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.handlers?.onClose();
  }
}
