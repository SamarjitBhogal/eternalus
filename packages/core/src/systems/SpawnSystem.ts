import { ContentValidationError } from '../content/ContentValidationError';
import type { OpeningWaveDefinition } from '../content/structures/structures.types';
import type { EntityFactory } from '../entities/EntityFactory';
import { Structure } from '../entities/structures/Structure';
import { Unit } from '../entities/Unit';
import { Transform } from '../components/Transform';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { HordeRequest } from '../state/HordeRequest.types';
import { assessLanes } from '../state/LaneAssessment';
import type { LaneRoutes } from '../state/LaneRoutes';
import type { PlayableTeam } from '../teams/teams.types';
import { compareById } from '../utils/compareById';
import type { Vec2 } from '../utils/geometry.types';
import { PLAYABLE_TEAMS } from './SpawnSystem.constants';
import { GuardRoster } from './GuardRoster';
import type { SpawnPlan } from './SpawnSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Spawns the lane hordes on the DISC-10 schedule (architecture 18 §3): the Stronghold's opening
 * hordes at tick 0, then every spawning structure's waves from the end of the countdown, after the
 * developer menu's queued requests (`state.hordeRequests`, 18 §3.5). Each
 * horde spawns at its structure's position and takes its own lane or the worst lane
 * (`assessLanes`). It is clipped to `limits.maxUnitsPerTeam`, with the team's `unitsRequested`
 * and `unitsSuppressed` counted (18 §3.4). Members and the horde record are created in one step,
 * then announced with `entity-spawned` and `horde-spawned` (18 §3.2), so no mob is ever without
 * its horde. The anchor starts at the lane point nearest the spawn point. Runs at the end of the
 * tick, before `DeathSystem`, so spawns land after this tick's movement.
 *
 * The spawners are the structure entities standing at construction; a destroyed one stops. The
 * schedule is computed from the tick, so the system keeps no schedule state of its own.
 *
 * It also runs every structure's guard plan (18 §7, 07 §6) through its `GuardRoster`.
 */
export class SpawnSystem implements System {
  public readonly name = 'spawn';
  private readonly spawners: readonly Structure[];
  private readonly guards: GuardRoster;

  /**
   * @param state - The match; its structure entities, already spawned, are the spawn points.
   * @param factory - Builds the minions.
   * @param plan - The waves, the opening wave, the definitions and the spawn layout.
   * @throws ContentValidationError when a wave this map can spawn names an unknown mob or a mob of
   *   another weight class, so bad content fails when the match is built, not when the wave is due.
   */
  public constructor(
    state: GameState,
    private readonly factory: EntityFactory,
    private readonly plan: SpawnPlan,
  ) {
    // The Stronghold sends the opening wave even when it has no recurring waves.
    const spawners: Structure[] = [];
    state.entities.forEach((entity) => {
      const team = state.entities.teamOf(entity.id);
      if (
        entity instanceof Structure &&
        (team === 'light' || team === 'dark') &&
        (entity.kind === 'stronghold' || plan.waves[entity.kind] !== undefined)
      ) {
        spawners.push(entity);
      }
    });
    this.spawners = spawners.sort((a, b) => compareById(a.id, b.id));
    this.validate();
    this.guards = new GuardRoster(factory, plan.definitions, plan.guards);
    this.guards.layOut(state);
  }

  /**
   * Rejects a plan whose waves name an unknown mob or a mob of another weight class. Only the
   * waves this map's spawners can send are checked, so a match without hordes needs no minions.
   */
  private validate(): void {
    const kinds = new Set(this.spawners.map(({ kind }) => kind));
    const waves = [
      ...(kinds.has('stronghold') ? [['opening', this.plan.openingWave] as const] : []),
      ...[...kinds].flatMap((kind) =>
        (this.plan.waves[kind] ?? []).map((wave) => [kind, wave] as const),
      ),
    ];
    const { definitions } = this.plan;
    const guardProblems = [...kinds].flatMap((kind) =>
      (this.plan.guards[kind]?.table ?? []).flatMap(({ mobId }) =>
        definitions.has(mobId) ? [] : [`${kind} guard plan names unknown mob "${mobId}"`],
      ),
    );
    const problems = guardProblems.concat(
      waves.flatMap(([source, { mobId, weightClass }]) => {
        if (!definitions.has(mobId)) {
          return [`${source} wave names unknown mob "${mobId}"`];
        }
        const { kind } = definitions.get(mobId);
        return kind === `${weightClass}-mob`
          ? []
          : [`${source} wave says "${mobId}" is ${weightClass}, but its kind is "${kind}"`];
      }),
    );
    if (problems.length > 0) {
      throw new ContentValidationError(`Invalid spawn plan: ${problems.join('; ')}`);
    }
  }

  /** Spawns the requested hordes in order, then every horde due this tick in spawner id order. */
  public update({ state }: SystemContext): void {
    const routes = state.routes;
    const requests = state.hordeRequests.splice(0);
    if (routes === null) {
      return;
    }
    for (const request of requests) {
      this.spawnHorde(state, routes, request);
    }
    for (const request of this.dueWaves(state, routes)) {
      this.spawnHorde(state, routes, request);
    }
    this.guards.update(state);
  }

  /** The scheduled hordes due this tick: the opening hordes at tick 0, then the DISC-10 waves. */
  private dueWaves(state: GameState, routes: LaneRoutes): HordeRequest[] {
    const { tickRate, match } = state.config;
    const due: HordeRequest[] = [];
    const wave = (team: PlayableTeam, from: Vec2, lane: string, mob: OpeningWaveDefinition) => {
      due.push({ ...mob, team, lane, origin: from, count: match.hordeSizes[mob.weightClass] });
    };
    const standing = this.spawners.flatMap((spawner) => {
      const team = state.entities.teamOf(spawner.id);
      const position = spawner.findComponent(Transform)?.position;
      return state.entities.isAlive(spawner.id) &&
        (team === 'light' || team === 'dark') &&
        position !== undefined
        ? [{ spawner, team, position }]
        : [];
    });
    if (state.tick === 0) {
      for (const team of PLAYABLE_TEAMS) {
        const stronghold = standing.find(
          (entry) => entry.spawner.kind === 'stronghold' && entry.team === team,
        );
        for (
          let index = 0;
          stronghold !== undefined && index < match.initialHordesPerTeam;
          index += 1
        ) {
          const lane = routes.lanes[index % routes.lanes.length];
          if (lane !== undefined) {
            wave(team, stronghold.position, lane.id, this.plan.openingWave);
          }
        }
      }
    }
    const sinceCountdown = state.tick - Math.round(match.countdownSeconds * tickRate);
    for (const { spawner, team, position } of sinceCountdown < 0 ? [] : standing) {
      for (const scheduled of this.plan.waves[spawner.kind] ?? []) {
        if (sinceCountdown % Math.max(1, Math.round(scheduled.everySeconds * tickRate)) !== 0) {
          continue;
        }
        const lane =
          scheduled.lane === 'own-lane'
            ? (spawner.laneId ?? undefined)
            : assessLanes(state, team, this.plan.weights);
        if (lane !== undefined) {
          wave(team, position, lane, scheduled);
        }
      }
    }
    return due;
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
