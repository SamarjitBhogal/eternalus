import type { MobKind } from '../content/mobs/mobs.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameEventMap } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import type { LegendStats, ScoringState } from '../state/ScoringState.types';
import type { Team } from '../teams/teams.types';
import type { DirectorContext } from './DirectorContext.types';
import type { PendingChange, ScoringOptions } from './Scoring.types';

/**
 * Turns spawns, hits and deaths into each Legend's counters and points and each team's total
 * (architecture 12 §5, DEC-79). Its listeners only buffer what they saw, reading the entity's
 * family, kind and team while it is still in the store; `fold` applies the buffer in the
 * director's pass, after `DeathSystem`, so a kill on the ending tick counts. Everything it counts
 * lives in `state.match.scoring`, so it is hashed and replayed. Once the match has a result it
 * buffers nothing.
 *
 * - Rows: one per Legend, from its `entity-spawned`. A row keeps its data after the Legend dies or
 *   leaves the store.
 * - Kills: only a Legend attacker (one with a row) earns a kill. A hit names its attacker (05 §9),
 *   so a projectile's hit counts for the Legend that fired it, even after that Legend died.
 * - Own side: a hit on or a kill of a unit on the attacker's own team (itself included) counts for
 *   nothing, as for XP (DEC-130; O5, 05 §18). The victim's death still counts.
 * - Assists: Legend victims only. Every other Legend that hit the victim inside the window earns
 *   one, also when a non-Legend landed the last hit.
 * - Mobs: points by weight class. Bosses, the sovereign and every other family give no points.
 */
export class Scoring {
  private readonly pending: PendingChange[] = [];
  private readonly assistWindowTicks: number;

  /**
   * @param state - The match whose events this listens to. Build it before anything spawns, so
   *   every Legend gets a row.
   * @param options - The points and the assist window.
   */
  public constructor(
    private readonly state: GameState,
    private readonly options: ScoringOptions,
  ) {
    this.assistWindowTicks = options.assistWindowSeconds * state.config.tickRate;
    state.events.on('entity-spawned', (payload) => {
      this.onSpawned(payload);
    });
    state.events.on('damage-applied', (payload) => {
      this.onHit(payload);
    });
    state.events.on('entity-died', (payload) => {
      this.onDied(payload);
    });
  }

  /** Applies this tick's buffered events in order. Called by the `MatchDirector`, once per tick. */
  public fold({ state }: DirectorContext): void {
    for (const change of this.pending.splice(0)) {
      change(state.match.scoring);
    }
  }

  /** Buffers a row for a Legend on a playable team; whether it is the human's is read at the fold. */
  private onSpawned({ entityId, team }: GameEventMap['entity-spawned']): void {
    const legend = this.state.entities.get(entityId);
    if (legend?.family !== 'legend' || team === 'neutral') {
      return;
    }
    const classId = legend.definitionId;
    this.defer((scoring) => {
      const controller = entityId === this.state.match.humanLegendId ? 'human' : 'bot';
      scoring.legends.push({
        entityId,
        team,
        classId,
        controller,
        kills: 0,
        deaths: 0,
        assists: 0,
        minionKills: 0,
        neutralKills: 0,
        structureDamage: 0,
        score: 0,
      });
    });
  }

  /**
   * Buffers a hit on a Legend (for assists) or on a structure (for `structureDamage`, which counts
   * the damage its shield bars absorbed too: DEC-123).
   */
  private onHit({
    targetId,
    amount,
    absorbed,
    source: { attackerId },
  }: GameEventMap['damage-applied']): void {
    const family = this.state.entities.get(targetId)?.family;
    if (attackerId === null || (family !== 'legend' && family !== 'structure')) {
      return;
    }
    const targetTeam = this.state.entities.teamOf(targetId);
    const { tick } = this.state;
    this.defer((scoring) => {
      const attacker = Scoring.rowOf(scoring, attackerId);
      if (attacker === undefined || attacker.team === targetTeam) {
        return;
      }
      if (family === 'structure') {
        attacker.structureDamage += amount + absorbed;
        return;
      }
      Scoring.rememberHit(scoring, targetId, attackerId, tick);
    });
  }

  /** Buffers a Legend's or a mob's death with the victim's family, kind and team, read now. */
  private onDied({ entityId, killer: { attackerId } }: GameEventMap['entity-died']): void {
    const victim = this.state.entities.get(entityId);
    if (victim === undefined) {
      return;
    }
    const { family, kind } = victim;
    const team = this.state.entities.teamOf(entityId);
    const { tick } = this.state;
    this.defer((scoring) => {
      if (family === 'legend') {
        this.legendDied(scoring, entityId, team, attackerId, tick);
      } else if (family === 'mob') {
        this.mobDied(scoring, kind, team, attackerId);
      }
    });
  }

  /** Buffers `change` until the next fold; nothing once the match has a result. */
  private defer(change: PendingChange): void {
    if (this.state.match.result === null) {
      this.pending.push(change);
    }
  }

  private legendDied(
    scoring: ScoringState,
    victimId: EntityId,
    team: Team | undefined,
    killerId: EntityId | null,
    tick: number,
  ): void {
    const { weights } = this.options;
    const victim = Scoring.rowOf(scoring, victimId);
    if (victim !== undefined) {
      victim.deaths += 1;
      Scoring.award(scoring, victim, weights.death);
    }
    const killer = killerId === null ? undefined : Scoring.rowOf(scoring, killerId);
    if (killer !== undefined && killer.team !== team) {
      killer.kills += 1;
      Scoring.award(scoring, killer, weights.legendKill);
    }
    const helpers = scoring.recentHits.filter(
      (hit) =>
        hit.victimId === victimId &&
        hit.legendId !== killerId &&
        tick - hit.tick <= this.assistWindowTicks,
    );
    scoring.recentHits = scoring.recentHits.filter((hit) => hit.victimId !== victimId);
    for (const { legendId } of helpers) {
      const helper = Scoring.rowOf(scoring, legendId);
      if (helper !== undefined) {
        helper.assists += 1;
        Scoring.award(scoring, helper, weights.legendKillAssist);
      }
    }
  }

  private mobDied(
    scoring: ScoringState,
    kind: string,
    team: Team | undefined,
    killerId: EntityId | null,
  ): void {
    const killer = killerId === null ? undefined : Scoring.rowOf(scoring, killerId);
    if (killer === undefined || killer.team === team || !this.isMobKind(kind)) {
      return;
    }
    if (team === 'neutral') {
      killer.neutralKills += 1;
    } else {
      killer.minionKills += 1;
    }
    Scoring.award(scoring, killer, this.options.weights.minionKill[kind]);
  }

  private isMobKind(kind: string): kind is MobKind {
    return Object.hasOwn(this.options.weights.minionKill, kind);
  }

  /** Adds `points` to the Legend's score and to its team's total, so the total is their sum. */
  private static award(scoring: ScoringState, row: LegendStats, points: number): void {
    row.score += points;
    scoring.teams[row.team].score += points;
  }

  private static rowOf(scoring: ScoringState, entityId: EntityId): LegendStats | undefined {
    return scoring.legends.find((row) => row.entityId === entityId);
  }

  private static rememberHit(
    scoring: ScoringState,
    victimId: EntityId,
    legendId: EntityId,
    tick: number,
  ): void {
    const known = scoring.recentHits.find(
      (hit) => hit.victimId === victimId && hit.legendId === legendId,
    );
    if (known === undefined) {
      scoring.recentHits.push({ victimId, legendId, tick });
    } else {
      known.tick = tick;
    }
  }
}
