import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Where a point lies along a lane for the team walking it: 0 at the team's own end, 1 at the
 * enemy's, or `null` where the source cannot say. `MinionStrengthStep` reads lane progress through
 * this port so `combat/` does not depend on `map/` (architecture 02 §2); the lane flow fields
 * implement it (`LaneFlowFields.progress`).
 */
export type LaneProgressOf = (laneId: string, team: PlayableTeam, position: Vec2) => number | null;
