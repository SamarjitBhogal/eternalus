import type { EntityId, MapObjectSnapshot } from '@eternalus/core';

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
  /** The player's Legend; `null` when its spawn failed (no Legend, no attack). */
  readonly playerId: EntityId | null;
  /** The map objects of the match's latest snapshot: what a click can attack. */
  readonly mapObjects: () => readonly MapObjectSnapshot[];
};
