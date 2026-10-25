/** What a behaviour-tree node reports (architecture 11 §4.2). */
export type BtStatus = 'success' | 'failure' | 'running';

/**
 * One node of a bot's behaviour tree (architecture 11 §4.2). Stateless: a tree is shared by every
 * bot that plays it, and `context` carries the one bot's situation and its decision so far.
 */
export interface BtNode<Context> {
  /** Evaluates this node for one bot. */
  tick(context: Context): BtStatus;
}
