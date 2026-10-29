import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type {
  CapturePointDefinition,
  CapturePointState,
  CaptureRules,
  CaptureStepResult,
} from './CapturePoint.types';

/** Leftover from adding up small per-tick steps; a bar this close to empty or full snaps to it. */
const PROGRESS_EPSILON = 1e-9;

/**
 * Whether `position` is inside the point's square zone. The ONLY shape check: swap this for a
 * circle or polygon later and nothing else changes.
 */
export function isInsideCapturePoint(point: CapturePointDefinition, position: Vec2): boolean {
  return (
    Math.abs(position.x - point.center.x) <= point.halfSize &&
    Math.abs(position.y - point.center.y) <= point.halfSize
  );
}

/**
 * Advances one capture point by one tick. Pure apart from changing `point`, so it is easy to test.
 *
 * Rules:
 * - Locked or contested (2+ teams inside): nothing moves.
 * - One team inside: its bar fills (faster with more units, up to the cap). If the bar belongs to
 *   the other team it drains first; a full bar makes that team the owner, and draining the
 *   owner's bar to 0 makes the point neutral.
 * - Nobody inside: the bar drains back to 0 and the point turns neutral again, unless
 *   `rules.keepOwnershipWhenEmpty` is set, in which case an owned point refills toward its owner.
 *
 * @param occupancy - Units inside per playable team (teams with 0 may be left out).
 * @param tickRate - Ticks per second (`config.tickRate`).
 */
export function stepCapturePoint(
  point: CapturePointState,
  occupancy: ReadonlyMap<Team, number>,
  rules: CaptureRules,
  tickRate: number,
  neutral: Team,
): CaptureStepResult {
  const ownerBefore = point.owner;
  const checkpointBefore = point.checkpoint;
  const present = [...occupancy].filter(([, count]) => count > 0);
  point.contested = present.length > 1;

  const first = present[0];
  if (point.locked || point.contested) {
    // Frozen.
  } else if (present.length === 1 && first !== undefined) {
    const [team, count] = first;
    const perUnit = 1 / (rules.captureSeconds * tickRate);
    moveToward(point, team, perUnit * Math.min(count, rules.maxCaptureMultiplier), neutral);
  } else {
    const decay = 1 / (rules.decaySeconds * tickRate);
    if (point.owner !== neutral && rules.keepOwnershipWhenEmpty) {
      moveToward(point, point.owner, decay, neutral);
    } else {
      drain(point, decay, neutral);
      if (point.progress === 0) {
        point.owner = neutral;
      }
    }
  }

  point.checkpoint = Math.min(rules.checkpoints, Math.floor(point.progress * rules.checkpoints));
  const ownerChanged = point.owner !== ownerBefore;
  point.heldTicks = point.owner === neutral || ownerChanged ? 0 : point.heldTicks + 1;

  return {
    ownerChanged: ownerChanged ? { from: ownerBefore, to: point.owner } : null,
    checkpointChanged: point.checkpoint !== checkpointBefore,
  };
}

/** Pushes the bar toward `team` by `amount`, draining another team's bar first. */
function moveToward(point: CapturePointState, team: Team, amount: number, neutral: Team): void {
  if (point.progress === 0 || point.progressTeam === team) {
    point.progressTeam = team;
    point.progress = point.progress + amount >= 1 - PROGRESS_EPSILON ? 1 : point.progress + amount;
    if (point.progress === 1) {
      point.owner = team;
    }
    return;
  }

  drain(point, amount, neutral);
  // The owner's bar ran out under an enemy: the point goes neutral.
  if (point.progress === 0 && point.owner !== team) {
    point.owner = neutral;
  }
}

/** Lowers the bar by `amount`; an empty bar belongs to nobody. */
function drain(point: CapturePointState, amount: number, neutral: Team): void {
  point.progress = point.progress - amount <= PROGRESS_EPSILON ? 0 : point.progress - amount;
  if (point.progress === 0) {
    point.progressTeam = neutral;
  }
}
