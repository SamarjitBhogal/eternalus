import type { BtNode, BtStatus } from './BtNode.types';

/** Succeeds when its test holds, fails otherwise; reads the situation, never acts (11 §4.2). */
export class Condition<Context> implements BtNode<Context> {
  /** @param test - A question about the bot's situation. */
  public constructor(private readonly test: (context: Context) => boolean) {}

  /** `success` when the test holds, else `failure`. */
  public tick(context: Context): BtStatus {
    return this.test(context) ? 'success' : 'failure';
  }
}
