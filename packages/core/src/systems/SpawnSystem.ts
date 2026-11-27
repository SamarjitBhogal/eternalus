import { Capturable } from '../components/Capturable';
import { Deploying } from '../components/Deploying';
import { Transform } from '../components/Transform';
import { ContentValidationError } from '../content/ContentValidationError';
import type { OpeningWaveDefinition } from '../content/structures/structures.types';
import type { Entity } from '../entities/Entity';
import type { EntityFactory } from '../entities/EntityFactory';
import { Structure } from '../entities/structures/Structure';
import { CapturePoint } from '../entities/zones/CapturePoint';
import { Unit } from '../entities/Unit';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { GameEventMap } from '../state/GameEvents.types';
import type { HordeRequest } from '../state/HordeRequest.types';
import { assessLanes } from '../state/LaneAssessment';
import type { LaneRoutes } from '../state/LaneRoutes';
import type { MatchWorld } from '../state/MatchWorld';
import type { PlayableTeam } from '../teams/teams.types';
import { compareById } from '../utils/compareById';
import type { Vec2 } from '../utils/geometry.types';
import { cancelWaitingDefenders } from './checkpointDefenders';
import { GuardRoster } from './GuardRoster';
import { spawnPlanProblems } from './spawnPlanProblems';
import type { CheckpointReached, PointLost, ScheduledWave, SpawnPlan } from './SpawnSystem.types';
import type { System, SystemContext } from './System.types';
import { isPlayableTeam } from '../teams/playableTeams';

/**
 * Spawns the lane hordes (architecture 18 §3): after the developer menu's queued requests
 * (`state.hordeRequests`, 18 §3.5), the opening hordes at load-in (tick 0), one per lane from the
 * lane's base (DEC-84, DEC-87 (e)), then every spawning structure's DISC-10 waves: each wave's
 * clock starts when the countdown ends, its first horde goes out `firstAtTicks` later and then
 * one every interval (DEC-87). Each wave horde spawns at its structure's position and takes its
 * own lane or the worst lane (`assessLanes`). A horde is clipped to `limits.maxUnitsPerTeam`,
 * with the team's `unitsRequested` and `unitsSuppressed` counted (18 §3.4). Members and the horde
 * record are created in one step, then announced with `entity-spawned` and `horde-spawned`
 * (18 §3.2), so no mob is ever without its horde. The anchor starts at the lane point nearest the
 * spawn point. Runs at the end of the tick, before `DeathSystem`, so spawns land after this tick's
 * movement.
 *
 * The spawners are the structure entities standing at construction; a destroyed one stops. The
 * schedule's times come in ticks, converted once at load (`loadSpawnWaves`), so the system keeps
 * no schedule state of its own.
 *
 * It also runs every structure's and zone's guard plan (18 §7, 07 §6) through its `GuardRoster`,
 * and adds a capture point's defenders when `checkpoint-reached` names it with a Legend present
 * (07 §7, 18 §7.1, DEC-259). A point that changes owner keeps its living defenders: they fight
 * the new owner inside the zone and count as presence for their own side (DEC-261); the old
 * owner's defenders still waiting for room under the unit cap are cancelled (DEC-350).
 */
export class SpawnSystem implements System {
  public readonly name = 'spawn';
  private readonly spawners: readonly Structure[];
  private readonly scheduled: readonly ScheduledWave[];
  private readonly guards: GuardRoster;
  private readonly singleUnits: GameEventMap['spawn-requested'][] = [];
  /** The checkpoints reached with a Legend present since the last pass, in order. */
  private readonly checkpointsReached: CheckpointReached[] = [];
  /** The capture points that changed owner since the last pass, in order. */
  private readonly pointsLost: PointLost[] = [];

  /**
   * @param state - The match; its structure entities, already spawned, are the spawn points, and
   *   its structures and zones, already spawned, the guard homes.
   * @param factory - Builds the minions.
   * @param plan - The waves and the guards (loaded in ticks), the opening wave, the definitions and
   *   the spawn layout.
   * @throws ContentValidationError when a wave this map can spawn names an unknown mob or a mob of
   *   another weight class, or a guard plan or checkpoint defender row names an unknown mob, so
   *   bad content fails when the match is built, not when the wave is due. Wave and guard times
   *   are checked at load (`loadSpawnWaves`, `loadGuardPlans`).
   */
  public constructor(
    state: GameState,
    private readonly factory: EntityFactory,
    private readonly plan: SpawnPlan,
  ) {
    // The opening source sends the opening hordes even when it has no recurring waves.
    const spawners: Structure[] = [];
    // The definition ids of every structure and zone on this map, whose guard plans are checked.
    const homes = new Set<string>();
    let hasCapturePoints = false;
    state.entities.forEach((entity) => {
      if (GuardRoster.isHome(entity)) {
        homes.add(entity.definitionId);
      }
      hasCapturePoints ||= entity instanceof CapturePoint;
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
    const { countdownEndTick } = state.match;
    this.scheduled = this.spawners.flatMap((spawner) =>
      (plan.waves[spawner.kind] ?? []).map((wave) => ({
        spawner,
        wave,
        firstTick: countdownEndTick + wave.firstAtTicks,
      })),
    );
    this.validate(homes, hasCapturePoints);
    this.guards = new GuardRoster(
      factory,
      plan.definitions,
      plan.guards,
      plan.defenders,
      plan.defenderLimit,
    );
    this.guards.layOut(state);
    state.events.on('spawn-requested', (request) => {
      this.singleUnits.push({ ...request, position: { ...request.position } });
    });
    // Queued for this system's pass (03 §4). DEC-259: only a push with a Legend on the zone wakes
    // the defenders, so passing hordes do not. The owner is read now: the same capture pass may
    // complete the capture after this event, and the defenders are the old owner's (DEC-257).
    state.events.on('checkpoint-reached', ({ pointId, checkpoint, presentLegendIds }) => {
      const owner = state.entities.get(pointId)?.findComponent(Capturable)?.owner;
      if (presentLegendIds.length > 0 && owner !== undefined) {
        this.checkpointsReached.push({ pointId, checkpoint, owner });
      }
    });
    state.events.on('capture-point-owner-changed', ({ pointId, from }) => {
      this.pointsLost.push({ pointId, from });
    });
  }

  /**
   * Rejects a plan whose waves name an unknown mob or a mob of another weight class, or whose
   * guard plans name an unknown mob. Only the waves this map's spawners can send and the guard
   * plans of the structures and zones on it (`homes`, by definition id, whether or not they spawn
   * hordes) are checked, and the checkpoint defenders when it has capture points, so a match
   * without hordes needs no minions.
   */
  private validate(homes: ReadonlySet<string>, hasCapturePoints: boolean): void {
    const { openingWave } = this.plan;
    const kinds = new Set(this.spawners.map(({ kind }) => kind));
    const waves = [
      ...(kinds.has(openingWave.source) ? [['opening', openingWave] as const] : []),
      ...this.scheduled.map(({ spawner, wave }) => [spawner.kind, wave] as const),
    ];
    const problems = spawnPlanProblems(this.plan, waves, homes, hasCapturePoints);
    if (problems.length > 0) {
      throw new ContentValidationError(`Invalid spawn plan: ${problems.join('; ')}`);
    }
  }

  /** Spawns the requested hordes in order, then every horde due this tick, then runs the guards. */
  public update({ state }: SystemContext): void {
    for (const request of this.singleUnits.splice(0)) {
      this.spawnSingleUnit(state, request);
    }
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
    // DEC-350: a lost owner's waiting defenders are cancelled before the posts fill, so none
    // appears late; a set reached on the pass that changed the owner is the old owner's (DEC-257),
    // so its defenders that find room appear now and the ones the cap blocks are cancelled after.
    const lost = this.pointsLost.splice(0);
    const cancel = (): void => {
      for (const { pointId, from } of lost) cancelWaitingDefenders(state, pointId, from);
    };
    cancel();
    for (const { pointId, checkpoint, owner } of this.checkpointsReached.splice(0)) {
      this.guards.defend(state, pointId, checkpoint, owner);
    }
    this.guards.update(state);
    cancel();
  }

  private spawnSingleUnit(
    state: GameState,
    { team, definitionId, position }: GameEventMap['spawn-requested'],
  ): void {
    const { kind } = this.factory.definitions.get(definitionId);
    const constructor = this.factory.registry.get(kind);
    if (constructor === undefined || !(constructor.prototype instanceof Unit)) {
      throw new ContentValidationError(`Invalid single-unit spawn definition "${definitionId}".`);
    }
    const hasRoom = state.entities.countOnTeam(team, Unit) < state.config.limits.maxUnitsPerTeam;
    state.recordSpawnRequest(team, 1, hasRoom ? 1 : 0);
    if (!hasRoom) return;
    const entity = this.factory.create(kind, definitionId, {
      team,
      position,
      ...state.world?.startFacing(team, position),
    });
    state.entities.add(entity);
    state.events.emit('entity-spawned', { entityId: entity.id, kind, team });
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
    for (const { spawner, wave, firstTick } of this.scheduled) {
      const sinceFirst = state.tick - firstTick;
      const team = SpawnSystem.standingTeam(state, spawner);
      if (sinceFirst < 0 || sinceFirst % wave.everyTicks !== 0 || team === undefined) {
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
      // Each member faces the enemy Stronghold until it first moves or attacks (DEC-216 (6)).
      const entity = this.factory.create(kind, mobId, {
        team,
        position,
        ...state.world?.startFacing(team, position),
      });
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
