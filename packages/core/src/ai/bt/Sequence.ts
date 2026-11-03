import type { BtNode, BtStatus } from './BtNode.types';

/** Runs its children in order while they succeed; reports the first that does not (11 §4.2). */
export class Sequence<Context> implements BtNode<Context> {
  /** @param children - Evaluated in this order. */
  public constructor(private readonly children: readonly BtNode<Context>[]) {}

  /** `success` when every child succeeds, else the first other status. */
  public tick(context: Context): BtStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      if (status !== 'success') {
        return status;
      }
    }
    return 'success';
  }
}
