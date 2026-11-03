import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { Horde } from './Horde.types';

/**
 * One horde to spawn (architecture 18 §3.2, §3.5): a scheduled wave or a developer-menu spawn.
 * `SpawnSystem` fulfils it at the end of the tick: it clips `count` to the unit cap, creates the
 * members and the record together and announces them.
 */
export type HordeRequest = {
  readonly team: PlayableTeam;
  readonly mobId: string;
  readonly weightClass: Horde['weightClass'];
  readonly count: number;
  /** `MapLane.id`. */
  readonly lane: string;
  /** Where the members appear; the anchor starts at the lane point nearest it. */
  readonly origin: Vec2;
};
