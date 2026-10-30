import { ContentValidationError } from '../content/ContentValidationError';
import type { OpeningWaveDefinition } from '../content/structures/structures.types';
import type { EntityFactory } from '../entities/EntityFactory';
import { Unit } from '../entities/Unit';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { HordeRequest } from '../state/HordeRequest.types';
import { assessLanes } from '../state/LaneAssessment';
import type { LaneRoutes } from '../state/LaneRoutes';
import type { PlayableTeam } from '../teams/teams.types';
import { compareById } from '../utils/compareById';
import type { Vec2 } from '../utils/geometry.types';
import type { ScheduledWave, SpawnPlan, TeamFeature } from './SpawnSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Spawns the lane hordes (architecture 18 §3): after the developer menu's queued requests
 * (`state.hordeRequests`, 18 §3.5), the opening hordes at load-in (tick 0), one per lane from the
 * lane's base (DEC-84), then every spawning structure's DISC-10 waves: each wave's clock starts when
 * the countdown ends, its first horde goes out `firstAtSeconds` later and then one every interval
 * (DEC-87). Each wave horde spawns at the structure's map position and takes
 * its own lane or the worst lane (`assessLanes`). A horde is clipped to `limits.maxUnitsPerTeam`,
 * with the team's `unitsRequested` and `unitsSuppressed` counted (18 §3.4). Members and the horde
 * record are created in one step, then announced with `entity-spawned` and `horde-spawned`
 * (18 §3.2), so no mob is ever without its horde. The anchor starts at the lane point nearest the
 * spawn point. Runs at the end of the tick, before `DeathSystem`, so spawns land after this tick's
 * movement.
 *
 * @remarks ponytail: spawns from the map's structure features, since structure entities arrive in
 * M2c (minion plan); the schedule is computed from the tick, so the system keeps no state of its
 * own.
 */
export class SpawnSystem implements System {
  public readonly name = 'spawn';
  private readonly spawners: readonly TeamFeature[];
  private readonly scheduled: readonly ScheduledWave[];

  /**
   * @param state - The match; its map's structure features are the spawn points.
   * @param factory - Builds the minions.
   * @param plan - The waves, the opening wave, the definitions and the spawn layout.
   * @throws ContentValidationError when a wave this map can spawn names an unknown mob or a mob of
   *   another weight class, starts before the countdown ends, or repeats more often than once a
   *   tick, so bad content fails when the match is built, not when the wave is due.
   */
  public constructor(
    state: GameState,
    private readonly factory: EntityFactory,
    private readonly plan: SpawnPlan,
  ) {
    // The opening source sends the opening hordes even when it has no recurring waves.
    this.spawners = (state.world?.definition.features ?? [])
      .filter(
        (feature): feature is TeamFeature =>
          feature.team !== 'neutral' &&
          (feature.kind === plan.openingWave.source || plan.waves[feature.kind] !== undefined),
      )
      .sort((a, b) => compareById(a.id, b.id));
    const { tickRate } = state.config;
    const countdownTicks = Math.round(state.config.match.countdownSeconds * tickRate);
    this.scheduled = this.spawners.flatMap((spawner) =>
      (plan.waves[spawner.kind] ?? []).map((wave) => ({
        spawner,
        wave,
        firstTick: countdownTicks + Math.round(wave.firstAtSeconds * tickRate),
        everyTicks: Math.round(wave.everySeconds * tickRate),
      })),
    );
    this.validate();
  }

  /**
   * Rejects a plan whose waves name an unknown mob or a mob of another weight class, start before
   * the countdown ends, or repeat more often than once a tick. Only the waves this map's spawners can send are checked, so a
   * match without hordes needs no minions.
   */
  private validate(): void {
    const { openingWave, definitions } = this.plan;
    const hasOpening = this.spawners.some(({ kind }) => kind === openingWave.source);
    const waves = [
      ...(hasOpening ? [['opening', openingWave] as const] : []),
      ...this.scheduled.map(({ spawner, wave }) => [spawner.kind, wave] as const),
    ];
    const mobProblems = waves.flatMap(([source, { mobId, weightClass }]) => {
      if (!definitions.has(mobId)) {
        return [`${source} wave names unknown mob "${mobId}"`];
      }
      const { kind } = definitions.get(mobId);
      return kind === `${weightClass}-mob`
        ? []
        : [`${source} wave says "${mobId}" is ${weightClass}, but its kind is "${kind}"`];
    });
    const timingProblems = this.scheduled.flatMap(({ spawner, wave, everyTicks }) => [
      ...(Number.isFinite(everyTicks) && everyTicks >= 1
        ? []
        : [`${spawner.kind} wave repeats every ${String(wave.everySeconds)} s`]),
      ...(Number.isFinite(wave.firstAtSeconds) && wave.firstAtSeconds >= 0
        ? []
        : [`${spawner.kind} wave starts ${String(wave.firstAtSeconds)} s after the countdown`]),
    ]);
    const problems = [...new Set([...mobProblems, ...timingProblems])];
    if (problems.length > 0) {
      throw new ContentValidationError(`Invalid spawn plan: ${problems.join('; ')}`);
    }
  }

  /** Spawns the requested hordes in order, then every horde due this tick. */
  public update({ state }: SystemContext): void {
    const routes = state.world?.routes;
    const requests = state.hordeRequests.splice(0);
    if (routes === undefined) {
      return;
    }
    for (const request of requests) {
      this.spawnHorde(state, routes, request);
    }
    const opening = state.tick === 0 ? this.openingHordes(state, routes) : [];
    for (const request of [...opening, ...this.dueWaves(state)]) {
      this.spawnHorde(state, routes, request);
    }
  }

  /** At tick 0: one opening horde per lane for each team with the opening source (DEC-84). */
  private openingHordes(state: GameState, routes: LaneRoutes): HordeRequest[] {
    const { openingWave } = this.plan;
    return this.spawners
      .filter(({ kind }) => kind === openingWave.source)
      .flatMap(({ team }) =>
        routes.lanes.map(({ id }) =>
          this.request(state, team, id, routes.start(id, team), openingWave),
        ),
      );
  }

  /** The DISC-10 waves due this tick: the first at `firstTick`, then one every interval (DEC-87). */
  private dueWaves(state: GameState): HordeRequest[] {
    const due: HordeRequest[] = [];
    for (const { spawner, wave, firstTick, everyTicks } of this.scheduled) {
      const sinceFirst = state.tick - firstTick;
      if (sinceFirst < 0 || sinceFirst % everyTicks !== 0) {
        continue;
      }
      const lane =
        wave.lane === 'own-lane'
          ? spawner.laneId
          : assessLanes(state, spawner.team, this.plan.weights);
      if (lane !== undefined) {
        due.push(this.request(state, spawner.team, lane, spawner.position, wave));
      }
    }
    return due;
  }

  /** A full-size horde of `wave`'s mob for `team` on `lane`, appearing at `origin`. */
  private request(
    state: GameState,
    team: PlayableTeam,
    lane: string,
    origin: Vec2,
    { mobId, weightClass }: Pick<OpeningWaveDefinition, 'mobId' | 'weightClass'>,
  ): HordeRequest {
    return {
      team,
      mobId,
      weightClass,
      lane,
      origin,
      count: state.config.match.hordeSizes[weightClass],
    };
  }

  /** Spawns one horde and its record in a grid around its origin, clipped to the unit cap. */
  private spawnHorde(state: GameState, routes: LaneRoutes, request: HordeRequest): void {
    const { team, mobId, weightClass, lane, origin, count: requested } = request;
    const room = state.config.limits.maxUnitsPerTeam - state.entities.countOnTeam(team, Unit);
    const count = Math.min(requested, Math.max(0, room));
    state.recordSpawnRequest(team, requested, count);
    if (count === 0) {
      return;
    }
    const kind = this.plan.definitions.get(mobId).kind;
    const { spawnSpacing, spawnColumns } = this.plan.steering;
    const columns = Math.min(count, spawnColumns);
    const rows = Math.ceil(count / columns);
    const memberIds: EntityId[] = [];
    for (let member = 0; member < count; member += 1) {
      const position = {
        x: origin.x + ((member % columns) - (columns - 1) / 2) * spawnSpacing,
        y: origin.y + (Math.floor(member / columns) - (rows - 1) / 2) * spawnSpacing,
      };
      const entity = this.factory.create(kind, mobId, { team, position });
      state.entities.add(entity);
      memberIds.push(entity.id);
    }
    const horde = state.hordes.add({
      id: state.hordes.nextId(),
      team,
      weightClass,
      lane,
      formationId: this.plan.formationId,
      memberIds,
      progress: routes.distanceAlong(lane, team, origin),
    });
    for (const entityId of memberIds) {
      state.events.emit('entity-spawned', { entityId, kind, team });
    }
    state.events.emit('horde-spawned', {
      hordeId: horde.id,
      lane,
      team,
      memberIds: horde.memberIds,
    });
  }
}
