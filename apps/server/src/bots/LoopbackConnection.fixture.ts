import type { ServerMessage } from '@eternalus/protocol';
import { FakeConnection } from '../transport/FakeConnection';

/** A server-side connection that hands what it is sent to a bot, later, when the test pumps. */
export class LoopbackConnection extends FakeConnection {
  public constructor(private readonly deliver: (message: ServerMessage) => void) {
    super();
  }

  public override send(message: ServerMessage): void {
    super.send(message);
    this.deliver(message);
  }
}
