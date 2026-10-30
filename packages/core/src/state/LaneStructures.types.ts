import type { PlayableTeam } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';

/** One structure as the lane index records it at match start (architecture 18 §6.2). */
export type LaneStructureEntry = {
  readonly id: EntityId;
  readonly kind: string;
  readonly team: PlayableTeam;
  /** `MapLane.id`; the Stronghold has none and closes every lane. */
  readonly lane: string | null;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  /** Base health plus shield bars at match start: the 100 % of `damageNotDealt` (18 §3.3). */
  readonly startingHealth: number;
};

/** A horde's next standing objective (18 §6.2), as the controllers and `HordeSystem` read it. */
export type LaneObjective = LaneStructureEntry & {
  /** Its distance along the lane from the attacking team's gate (the horde's `progress` scale). */
  readonly progress: number;
  /**
   * The lane point a horde gathers at to attack it: its near edge for a structure on the lane, the
   * lane's end for the Stronghold, which stands off the lane inside its wall ring.
   */
  readonly frontProgress: number;
  /** False for a gate whose breakability rule has not passed: the horde holds in front of it. */
  readonly isBreakable: boolean;
};
