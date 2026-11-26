import type { LoadoutContent, Logger } from '@eternalus/core';

import type { BridgeEventMap } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import type { TypedEventBus } from '../../bridge/TypedEventBus';

/** What the profile keeps for one Legend (08 "Saved to the profile"): its primary weapon. */
export type SavedLoadout = { readonly primaryWeaponId: string };

/**
 * The part of `PersistenceController` the controller uses (rule 13: the facade owns the profile).
 * Loadouts are keyed by the Legend's `specId` (DEC-354 (1)). `loadLoadouts` names the Legends
 * because the storage port has no scan; a Legend with nothing saved, or a corrupt record, is
 * absent from the map.
 */
type LoadoutStorage = {
  loadLoadouts(specIds: readonly string[]): Promise<ReadonlyMap<string, SavedLoadout>>;
  saveLoadout(specId: string, loadout: SavedLoadout): Promise<void>;
};

/** What `main.tsx` injects into `LoadoutController`. */
export type LoadoutControllerDeps = {
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly persistence: LoadoutStorage;
  /** Where load, save and repair outcomes are reported. */
  readonly logger: Logger;
  /** What each Legend may take, and its class, from core content (`legendLoadoutOptions`). */
  readonly options: LoadoutsSliceState['options'];
  /** What loadouts are validated, repaired and auto-built against (`loadoutContentOf`). */
  readonly content: LoadoutContent;
};
