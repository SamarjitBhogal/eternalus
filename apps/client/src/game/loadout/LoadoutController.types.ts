import type { Logger } from '@eternalus/core';

import type { BridgeEventMap } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import type { TypedEventBus } from '../../bridge/TypedEventBus';

/** What the profile keeps for one class (08 "Saved to the profile"): its primary weapon. */
export type SavedLoadout = { readonly primaryWeaponId: string };

/**
 * The part of the loadout repository the controller uses (`LoadoutRepository` satisfies it
 * structurally). `loadAll` names the classes because the storage port has no scan; a class with
 * nothing saved, or a corrupt record, is absent from the map.
 */
type LoadoutStorage = {
  loadAll(
    profileId: string,
    classIds: readonly string[],
  ): Promise<ReadonlyMap<string, SavedLoadout>>;
  save(profileId: string, classId: string, loadout: SavedLoadout): Promise<void>;
};

/** What `main.tsx` injects into `LoadoutController`. */
export type LoadoutControllerDeps = {
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly persistence: LoadoutStorage;
  /** Where load, save and repair outcomes are reported. */
  readonly logger: Logger;
  /** The profile whose loadouts these are. */
  readonly profileId: string;
  /** What each class may take, from core content (read once by the composition root). */
  readonly options: LoadoutsSliceState['options'];
};
