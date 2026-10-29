import { DEFAULT_CAPTURE_RULES, isPlayableTeam, NEUTRAL_TEAM } from '../capture/capture.constants';
import type { CaptureRules } from '../capture/CapturePoint.types';
import { isInsideCapturePoint, stepCapturePoint } from '../capture/stepCapturePoint';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { Team } from '../teams/teams.types';
import type { System, SystemContext } from './System.types';

/**
 * Capture points: counts each playable team's units inside every zone, moves the bars and
 * announces checkpoints and owner changes. Runs after movement and death, so it sees where the
 * living units ended up this tick.
 *
 * Emits `capture-progress` when a checkpoint is reached or lost, and
 * `capture-point-owner-changed` when a point flips. Buffs, mob spawns and XP should listen to
 * those events (architecture 01 rule 12) rather than live here.
 */
export class CaptureSystem implements System {
  public readonly name = 'capture';

  /** @param rules - Capture tuning; `DEFAULT_CAPTURE_RULES` when omitted. */
  public constructor(private readonly rules: CaptureRules = DEFAULT_CAPTURE_RULES) {}

  public update({ state }: SystemContext): void {
    const tickRate = state.config.tickRate;

    state.capturePoints.forEach((point) => {
      const occupancy = new Map<Team, number>();
      state.entities.forEach((entity) => {
        const team = entity.findComponent(TeamMembership)?.team;
        if (team === undefined || !isPlayableTeam(team)) {
          return;
        }
        const transform = entity.findComponent(Transform);
        if (transform !== undefined && isInsideCapturePoint(point, transform.position)) {
          occupancy.set(team, (occupancy.get(team) ?? 0) + 1);
        }
      });

      const result = stepCapturePoint(point, occupancy, this.rules, tickRate, NEUTRAL_TEAM);

      if (result.checkpointChanged) {
        state.events.emit('capture-progress', {
          pointId: point.id,
          team: point.progressTeam,
          progress: point.progress,
          checkpoint: point.checkpoint,
        });
      }
      if (result.ownerChanged !== null) {
        state.events.emit('capture-point-owner-changed', {
          pointId: point.id,
          from: result.ownerChanged.from,
          to: result.ownerChanged.to,
        });
      }
    });
  }
}
