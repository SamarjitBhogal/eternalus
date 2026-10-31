import type { BtNode, BtStatus } from './BtNode.types';

/**
 * Tries its children in priority order on every tick and reports the first that does not fail
 * (11 §4.2): a higher branch is re-checked each time, so it interrupts a lower one that is running.
 */
export class ActiveSelector<Context> implements BtNode<Context> {
  /** @param children - Highest priority first. */
  public constructor(private readonly children: readonly BtNode<Context>[]) {}

  /** The first status other than `failure`, or `failure` when every child fails. */
  public tick(context: Context): BtStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      if (status !== 'failure') {
        return status;
      }
    }
    return 'failure';
  }
}
