import type { BtNode, BtStatus } from './BtNode.types';

/** Does something for the bot, such as adding a command to its decision (11 §4.2). */
export class Action<Context> implements BtNode<Context> {
  /** @param act - Writes into the context and reports how it went. */
  public constructor(private readonly act: (context: Context) => BtStatus) {}

  /** Whatever the act reports. */
  public tick(context: Context): BtStatus {
    return this.act(context);
  }
}
