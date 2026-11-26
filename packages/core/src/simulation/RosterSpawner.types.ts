import type { RosterSlot } from '../Simulation.types';
import type { PlayableTeam } from '../teams/teams.types';

/** One team's laners and the lane each one takes, index for index. */
export type LanePlan = {
  readonly team: PlayableTeam;
  readonly laners: readonly RosterSlot[];
  readonly lanes: readonly string[];
};
