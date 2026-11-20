import type { EntityId } from '../state/EntityStore.types';
import type { UltimateChargeCause } from '../state/GameEvents.types';

/** One change of a Legend's ultimate meter waiting for `ProgressionSystem`'s pass, in points. */
export type ChargeChange = {
  readonly recipientId: EntityId;
  /** Signed: a death takes points. */
  readonly points: number;
  readonly cause: UltimateChargeCause;
};
