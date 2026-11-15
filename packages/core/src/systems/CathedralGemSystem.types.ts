import type { EntityId } from '../state/EntityStore.types';

/** A direct hit on the gem, waiting for the next update to be struck back. */
export type GemHit = { readonly gemId: EntityId; readonly attackerId: EntityId };
