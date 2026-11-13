import type { EntityId, Snapshot } from '@eternalus/core';

import type { BuildingRoofs } from './BuildingRoofs';
import type { MatchCamera } from './MatchCamera';
import type { PlayerCommands } from './PlayerCommands';
import type { MiniMapView } from './views/MiniMapView';

/** The parts of a `Match` its view controls drive; `Match` builds them and owns their lifetime. */
export type MatchViewControlsDeps = {
  readonly camera: MatchCamera;
  readonly roofs: BuildingRoofs;
  readonly commands: PlayerCommands;
  readonly miniMap: MiniMapView;
  /** Told whenever the player shows or hides the minimap (`Match` publishes it to the HUD). */
  readonly onMiniMapShownChanged: (isShown: boolean) => void;
  /** The player's Legend; `null` when its spawn failed (no Legend, no attack). */
  readonly playerId: EntityId | null;
  /** The match's latest snapshot: its units and map objects are what a click can attack. */
  readonly snapshot: () => Pick<Snapshot, 'entities' | 'mapObjects'>;
};
