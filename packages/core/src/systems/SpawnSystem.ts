import { Deploying } from '../components/Deploying';
import { Transform } from '../components/Transform';
import { ContentValidationError } from '../content/ContentValidationError';
import type { OpeningWaveDefinition } from '../content/structures/structures.types';
import type { Entity } from '../entities/Entity';
import type { EntityFactory } from '../entities/EntityFactory';
import { Structure } from '../entities/structures/Structure';
import { Unit } from '../entities/Unit';
import { Zone } from '../entities/Zone';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { HordeRequest } from '../state/HordeRequest.types';
import { assessLanes } from '../state/LaneAssessment';
import type { LaneRoutes } from '../state/LaneRoutes';
import type { MatchWorld } from '../state/MatchWorld';
import type { PlayableTeam } from '../teams/teams.types';
import { compareById } from '../utils/compareById';
import type { Vec2 } from '../utils/geometry.types';
import { GuardRoster } from './GuardRoster';
import type { ScheduledWave, SpawnPlan } from './SpawnSystem.types';
import type { System, SystemContext } from './System.types';
import { countdownTicks } from '../config/countdownTicks';
import { isPlayableTeam } from '../teams/playableTeams';

/**
 * Spawns the lane hordes (architecture 18 §3): after the developer menu's queued requests
 * (`state.hordeRequests`, 18 §3.5), the opening hordes at load-in (tick 0), one per lane from the
 * lane's base (DEC-84, DEC-87 (e)), then every spawning structure's DISC-10 waves: each wave's
 * clock starts when the countdown ends, its first horde goes out `firstAtSeconds` later and then
 * one every interval (DEC-87). Each wave horde spawns at its structure's position and takes its
 * own lane or the worst lane (`assessLanes`). A horde is clipped to `limits.maxUnitsPerTeam`,
 * with the team's `unitsRequested` and `unitsSuppressed` counted (18 §3.4). Members and the horde
 * record are created in one step, then announced with `entity-spawned` and `horde-spawned`
 * (18 §3.2), so no mob is ever without its horde. The anchor starts at the lane point nearest the
 * spawn point. Runs at the end of the tick, before `DeathSystem`, so spawns land after this tick's
 * movement.
 *
 * The spawners are the structure entities standing at construction; a destroyed one stops. The
 * schedule's times are converted to ticks once, so the system keeps no schedule state of its own.
 *
 * It also runs every structure's and zone's guard plan (18 §7, 07 §6) through its `GuardRoster`.
 */
export class SpawnSystem implements System {
  public readonly name = 'spawn';
  private readonly spawners: readonly Structure[];
  private readonly scheduled: readonly ScheduledWave[];
  private readonly guards: GuardRoster;
  /** The definition ids of the structures and zones on this map, whose guard plans are checked. */
  private readonly homes = new Set<string>();

  /**
   * @param state - The match; its structure entities, already spawned, are the spawn points, and
   *   its structures and zones, already spawned, the guard homes.
   * @param factory - Builds the minions.
   * @param plan - The waves, the opening wave, the guards, the definitions and the spawn layout.
   * @throws ContentValidationError when a wave this map can spawn names an unknown mob or a mob of
   *   another weight class, starts before the countdown ends, or repeats more often than once a
   *   tick, or a guard plan names an unknown mob, so bad content fails when the match is built,
   *   not when the wave is due. A guard plan that activates a negative or non-finite number of
   *   seconds after the countdown is rejected too.
   */
  public constructor(
    state: GameState,
    private readonly factory: EntityFactory,
    private readonly plan: SpawnPlan,
  ) {
    // The opening source sends the opening hordes even when it has no recurring waves.
    const spawners: Structure[] = [];
    state.entities.forEach((entity) => {
      if (entity instanceof Structure || entity instanceof Zone) {
        this.homes.add(entity.definitionId);
      }
      const team = state.entities.teamOf(entity.id);
      if (
        entity instanceof Structure &&
        isPlayableTeam(team) &&
        (entity.kind === plan.openingWave.source || plan.waves[entity.kind] !== undefined)
      ) {
        spawners.push(entity);
      }
    });
    this.spawners = spawners.sort((a, b) => compareById(a.id, b.id));
    const { tickRate } = state.config;
    const countdownEnd = countdownTicks(state.config.match.countdownSeconds, tickRate);
    this.scheduled = this.spawners.flatMap((spawner) =>
      (plan.waves[spawner.kind] ?? []).map((wave) => ({
        spawner,
        wave,
        firstTick: countdownEnd + Math.round(wave.firstAtSeconds * tickRate),
        everyTicks: Math.round(wave.everySeconds * tickRate),
      })),
    );
    this.validate();
    this.guards = new GuardRoster(factory, plan.definitions, plan.guards);
    this.guards.layOut(state);
  }

  /**
   * Rejects a plan whose waves name an unknown mob or a mob of another weight class, start before
   * the countdown ends, or repeat more often than once a tick, or whose guard plans name an
   * unknown mob or activate a negative or non-finite number of seconds after the countdown. Only
   * the waves and guards this map's spawners and homes can have are checked, so a match without
   * hordes needs no minions.
   */
  private validate(): void {
    const { openingWave, definitions, guards } = this.plan;
    const kinds = new Set(this.spawners.map(({ kind }) => kind));
    const waves = [
      ...(kinds.has(openingWave.source) ? [['opening', openingWave] as const] : []),
      ...this.scheduled.map(({ spawner, wave }) => [spawner.kind, wave] as const),
    ];
    // Only the plans of structures and zones on this map, so a match without them needs no guard
    // content.
    const guardProblems = [...this.homes].flatMap((id) => {
      const plan = guards[id];
      if (plan === undefined) {
        return [];
      }
      const { activation } = plan;
      const delay = activation.at === 'countdown-end' ? activation.delaySeconds : 0;
      return [
        ...plan.table.flatMap(({ mobId }) =>
          definitions.has(mobId) ? [] : [`${id} guard plan names unknown mob "${mobId}"`],
        ),
        ...(Number.isFinite(delay) && delay >= 0
          ? []
          : [`${id} guard plan activates ${String(delay)} s after the countdown`]),
      ];
    });
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
    const problems = [...new Set([...guardProblems, ...mobProblems, ...timingProblems])];
    if (problems.length > 0) {
      throw new ContentValidationError(`Invalid spawn plan: ${problems.join('; ')}`);
    }
  }

  /** Spawns the requested hordes in order, then every horde due this tick, then runs the guards. */
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
    this.guards.update(state);
  }

  /**
   * At tick 0: one opening horde per lane for each team whose opening source stands (DEC-84,
   * DEC-87 (e)).
   */
  private openingHordes(state: GameState, routes: LaneRoutes): HordeRequest[] {
    const { openingWave } = this.plan;
    return this.spawners
      .filter(({ kind }) => kind === openingWave.source)
      .flatMap((spawner) => {
        const team = SpawnSystem.standingTeam(state, spawner);
        return team === undefined
          ? []
          : routes.lanes.map(({ id }) =>
              this.request(state, team, id, routes.start(id, team), openingWave),
            );
      });
  }

  /**
   * The DISC-10 waves due this tick from the standing spawners: the first at `firstTick`, then one
   * every interval (DEC-87).
   */
  private dueWaves(state: GameState): HordeRequest[] {
    const due: HordeRequest[] = [];
    for (const { spawner, wave, firstTick, everyTicks } of this.scheduled) {
      const sinceFirst = state.tick - firstTick;
      const team = SpawnSystem.standingTeam(state, spawner);
      if (sinceFirst < 0 || sinceFirst % everyTicks !== 0 || team === undefined) {
        continue;
      }
      const lane =
        wave.lane === 'own-lane' ? (spawner.laneId ?? undefined) : this.worstLane(state, team);
      if (lane !== undefined) {
        const origin = spawner.getComponent(Transform).position;
        due.push(this.request(state, team, lane, origin, wave));
      }
    }
    return due;
  }

  /** `spawner`'s playable team while it stands; `undefined` once it is destroyed. */
  private static standingTeam(state: GameState, spawner: Structure): PlayableTeam | undefined {
    const team = state.entities.teamOf(spawner.id);
    return state.entities.isAlive(spawner.id) && isPlayableTeam(team) ? team : undefined;
  }

  /**
   * The lane `team`'s Stronghold heavy wave takes (18 §3.3). Picking it ends the team's ally-damage
   * window, so its tally is cleared right after (DEC-89).
   */
  private worstLane(state: GameState, team: PlayableTeam): string | undefined {
    const lane = assessLanes(state, team, this.plan.weights);
    state.allyDamage.clear(team);
    return lane;
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
    const members: Entity[] = [];
    for (let member = 0; member < count; member += 1) {
      const position = {
        x: origin.x + ((member % columns) - (columns - 1) / 2) * spawnSpacing,
        y: origin.y + (Math.floor(member / columns) - (rows - 1) / 2) * spawnSpacing,
      };
      const entity = this.factory.create(kind, mobId, { team, position });
      state.entities.add(entity);
      members.push(entity);
    }
    if (state.world !== null) {
      this.deploy(state.world, request, members);
    }
    const memberIds: EntityId[] = members.map(({ id }) => id);
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

  /**
   * Gives each member of a horde spawned on blocked ground a `Deploying` exit straight along the
   * lane's march axis, out through its structure's up-lane doorway (DEC-133). A horde with no
   * walkable ground along that axis keeps its brain.
   *
   * @remarks ponytail: the march direction snaps to its larger axis, since forts are axis-aligned
   * with their lane gates facing up-lane; a rotated fort needs its doorway's own direction.
   */
  private deploy(world: MatchWorld, request: HordeRequest, members: readonly Entity[]): void {
    const { grid, routes, definition } = world;
    const { origin, lane, team } = request;
    if (grid.isWalkableAt(origin.x, origin.y)) {
      return;
    }
    const forward = { x: 0, y: 0 };
    routes.pose(lane, team, routes.distanceAlong(lane, team, origin), { x: 0, y: 0 }, forward);
    const isAlongX = Math.abs(forward.x) >= Math.abs(forward.y);
    const ax = isAlongX ? Math.sign(forward.x) : 0;
    const ay = isAlongX ? 0 : Math.sign(forward.y);
    const limit = Math.max(definition.width, definition.height);
    let open = grid.cellSize;
    while (open <= limit && !grid.isWalkableAt(origin.x + ax * open, origin.y + ay * open)) {
      open += grid.cellSize;
    }
    if (open > limit) {
      return;
    }
    const positionOf = (member: Entity): Vec2 => member.getComponent(Transform).position;
    const behind = Math.max(
      0,
      ...members.map(positionOf).map(({ x, y }) => (origin.x - x) * ax + (origin.y - y) * ay),
    );
    const reach = open + behind + this.plan.steering.deployClearance;
    for (const member of members) {
      const { x, y } = positionOf(member);
      member.addComponent(new Deploying({ x: x + ax * reach, y: y + ay * reach }));
    }
  }
}
