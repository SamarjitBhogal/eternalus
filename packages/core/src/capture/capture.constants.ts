import type { PlayableTeam, Team } from '../teams/teams.types';
import type { CaptureRules } from './CapturePoint.types';

/** The team that owns nothing. */
export const NEUTRAL_TEAM: Team = 'neutral';

/** Whether `team` can capture points. */
export function isPlayableTeam(team: Team): team is PlayableTeam {
  return team !== NEUTRAL_TEAM;
}

/** Starting tuning. Easy to change; nothing else hard-codes these numbers. */
export const DEFAULT_CAPTURE_RULES: CaptureRules = {
  captureSeconds: 12,
  decaySeconds: 20,
  maxCaptureMultiplier: 3,
  checkpoints: 3,
  keepOwnershipWhenEmpty: false,
};

// TUNE: zone sizes are placeholders; half the square's side as a fraction of the map width.
/** Half-size of a lane capture zone, as a fraction of the map width. */
export const LANE_ZONE_SIZE = 0.025;
/** Half-size of the Cathedral zone (the major point), as a fraction of the map width. */
export const CATHEDRAL_ZONE_SIZE = 0.05;
