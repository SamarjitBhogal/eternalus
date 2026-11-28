import type { EntityId, InputIntent, Snapshot } from '@eternalus/core';

import type { DuelLink } from './DuelLink.types';

/** Test double of a started Duel (02 §8): serves a snapshot a test sets and records every intent. */
export class FakeDuelLink implements DuelLink {
  /** Every intent sent, in order. */
  public readonly intents: InputIntent[] = [];

  /** @param legendId - This player's Legend. @param snapshot - What `latestSnapshot` answers. */
  public constructor(
    public readonly legendId: EntityId,
    public snapshot: Snapshot,
  ) {}

  /** The snapshot the test set last. */
  public latestSnapshot(): Snapshot {
    return this.snapshot;
  }

  /** Records `intent`. */
  public sendIntent(intent: InputIntent): void {
    this.intents.push(intent);
  }
}
