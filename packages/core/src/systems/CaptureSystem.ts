import { Capturable } from '../components/Capturable';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { CapturePointsConfig } from '../config/GameConfig.types';
import { Legend } from '../entities/Legend';
import { Unit } from '../entities/Unit';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import { TickRate } from '../utils/TickRate';
import { CAPTURE_SIDES, PROGRESS_EPSILON } from './CaptureSystem.constants';
import type { CaptureMove, CaptureZone, SideWeights } from './CaptureSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Moves every capture point's progress (architecture 07 §7, DEC-86). Each tick it sums, per zone,
 * the weight of the units whose centre is on the zone's area (DEC-145 (a); Legends weigh more than
 * other units; structures, projectiles and zones never count) and keeps those sums as the zone's
 * presence (DEC-145 (c)). The heaviest side moves the progress toward its locking state (+1 Light,
 * -1 Dark, 0 neutral), faster the larger its margin over the next side, up to `maxMargin`; a tie
 * at the top pauses it. Taking an enemy zone drains the owner's progress through 0 first, and the
 * zone stays the owner's until the capture completes. With nobody inside, an unfinished capture
 * falls back to the owner's locking state, so an owned zone stays owned.
 *
 * Emits `capture-progress` when a zone passes a checkpoint (either way), `checkpoint-reached`
 * when a side's push on a zone it does not own passes one for the first time since the zone last
 * changed owner (FR-031, DEC-145 (b), (g)), then `capture-point-owner-changed` when a capture
 * completes.
 * Only living units count: it runs after `DeathSystem`, and a dead Legend the store keeps for its
 * respawn is skipped.
 */
export class CaptureSystem implements System {
  public readonly name = 'capture';
  private readonly capturePerTick: number;
  private readonly revertPerTick: number;

  /**
   * @param rules - The capture tuning (`GameConfig.match.capturePoints`).
   * @param tickRate - `GameConfig.tickRate`; the authored seconds are turned into ticks once here.
   */
  public constructor(
    private readonly rules: CapturePointsConfig,
    tickRate: number,
  ) {
    const rate = new TickRate(tickRate);
    this.capturePerTick = 1 / rate.toTicks(rules.captureSeconds);
    this.revertPerTick = 1 / rate.toTicks(rules.revertSeconds);
  }

  /** Moves every zone one tick and announces its checkpoints and captures. */
  public update({ state }: SystemContext): void {
    const zones: CaptureZone[] = [];
    const units: Unit[] = [];
    state.entities.forEach((entity) => {
      const capturable = entity.findComponent(Capturable);
      const area = entity.findComponent(ZoneArea);
      if (capturable !== undefined && area !== undefined) {
        zones.push({ entity, capturable, area });
      } else if (entity instanceof Unit && entity.findComponent(Health)?.isDead !== true) {
        units.push(entity);
      }
    });
    for (const zone of zones) {
      this.advance(state, zone, this.weightsInside(zone, units));
    }
  }

  /** The summed weight of each side's units whose centre is on `zone`'s area. */
  private weightsInside(zone: CaptureZone, units: readonly Unit[]): SideWeights {
    const weights: SideWeights = { light: 0, dark: 0, neutral: 0 };
    for (const unit of units) {
      const position = unit.findComponent(Transform)?.position;
      const team = unit.findComponent(TeamMembership)?.team;
      if (position === undefined || team === undefined) {
        continue;
      }
      if (zone.area.contains(position)) {
        weights[team] +=
          unit instanceof Legend ? this.rules.weights.legend : this.rules.weights.unit;
      }
    }
    return weights;
  }

  /** Moves one zone and emits its events. */
  private advance(state: GameState, zone: CaptureZone, weights: SideWeights): void {
    const { capturable } = zone;
    capturable.setPresence(weights);
    const move = this.moveFor(capturable, weights);
    if (move === null) {
      return;
    }
    const progress = CaptureSystem.approach(capturable.progress, move.target, move.step);
    const { checkpoints } = this.rules;
    const checkpoint = Math.min(
      checkpoints,
      Math.floor(Math.abs(progress) * checkpoints + PROGRESS_EPSILON),
    );
    const checkpointBefore = capturable.checkpoint;
    capturable.setProgress(progress, checkpoint);
    if (checkpoint !== checkpointBefore) {
      state.events.emit('capture-progress', {
        pointId: zone.entity.id,
        team: capturable.progressTeam,
        progress,
        checkpoint,
      });
    }
    const { leader } = move;
    if (leader !== null) {
      this.reachCheckpoints(state, zone, leader);
    }
    // A capture completes when its leader brings the zone to that leader's locking state.
    if (leader !== null && progress === move.target && leader !== capturable.owner) {
      const from = capturable.setOwner(leader);
      state.events.emit('capture-point-owner-changed', {
        pointId: zone.entity.id,
        from,
        to: leader,
      });
    }
  }

  /**
   * Announces the checkpoints `leader`'s push passed this tick. Only a push on a zone the leader
   * does not own, with the progress on the leader's side, counts: a drain lowers the other side's
   * checkpoint, a revert has no side, and an owner refilling its own zone reaches nothing. Each
   * side reaches a checkpoint once until the zone changes owner (DEC-145 (g)).
   */
  private reachCheckpoints(
    state: GameState,
    { entity, capturable }: CaptureZone,
    leader: Team,
  ): void {
    if (leader === capturable.owner || leader !== capturable.progressTeam) {
      return;
    }
    for (let passed = capturable.reachedBy(leader) + 1; passed <= capturable.checkpoint; passed++) {
      state.events.emit('checkpoint-reached', {
        pointId: entity.id,
        team: leader,
        checkpoint: passed,
      });
    }
    capturable.markReached(leader, capturable.checkpoint);
  }

  /** Where the zone heads this tick, or `null` when the top two sides tie (it pauses). */
  private moveFor(capturable: Capturable, weights: SideWeights): CaptureMove | null {
    const ranked = [...CAPTURE_SIDES].sort((a, b) => weights[b] - weights[a]);
    const [first = 'neutral', second = 'neutral'] = ranked;
    const top = weights[first];
    if (top === 0) {
      return { target: capturable.lockingProgress, step: this.revertPerTick, leader: null };
    }
    const margin = top - weights[second];
    if (margin === 0) {
      return null;
    }
    return {
      target: Capturable.lockingProgressOf(first),
      step: Math.min(margin, this.rules.maxMargin) * this.capturePerTick,
      leader: first,
    };
  }

  /**
   * `from` moved toward `to` by at most `step`, landing exactly on `to` when it gets there and
   * exactly on 0 (the neutral state) when it passes through it.
   */
  private static approach(from: number, to: number, step: number): number {
    const gap = to - from;
    if (Math.abs(gap) <= step + PROGRESS_EPSILON) {
      return to;
    }
    const next = from + Math.sign(gap) * step;
    return Math.abs(next) <= PROGRESS_EPSILON ? 0 : next;
  }
}
