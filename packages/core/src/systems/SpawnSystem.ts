import type { OpeningWaveDefinition } from '../content/structures/structures.types';
import type { EntityFactory } from '../entities/EntityFactory';
import { Unit } from '../entities/Unit';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { assessLanes } from '../state/LaneAssessment';
import type { LaneRoutes } from '../state/LaneRoutes';
import type { PlayableTeam } from '../teams/teams.types';
import { compareById } from '../utils/compareById';
import type { Vec2 } from '../utils/geometry.types';
import { PLAYABLE_TEAMS } from './SpawnSystem.constants';
import type { SpawnPlan, TeamFeature } from './SpawnSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Spawns the lane hordes on the DISC-10 schedule (architecture 18 §3): the Stronghold's opening
 * hordes at tick 0, then every spawning structure's waves from the end of the countdown. Each
 * horde spawns at the structure's map position and takes its own lane or the worst lane
 * (`assessLanes`). It is clipped to `limits.maxUnitsPerTeam`, with the team's `unitsRequested`
 * and `unitsSuppressed` counted (18 §3.4). Members and the horde record are created in one step,
 * then announced with `entity-spawned` and `horde-spawned` (18 §3.2), so no mob is ever without
 * its horde. The anchor starts at the lane point nearest the spawn point. Runs at the end of the
 * tick, before `DeathSystem`, so spawns land after this tick's movement.
 *
 * @remarks ponytail: spawns from the map's structure features, since structure entities arrive in
 * M2; the schedule is computed from the tick, so the system keeps no state of its own.
 */
export class SpawnSystem implements System {
  public readonly name = 'spawn';
  private readonly spawners: readonly TeamFeature[];

  /**
   * @param state - The match; its map's structure features are the spawn points.
   * @param factory - Builds the minions.
   * @param plan - The waves, the opening wave, the definitions and the spawn layout.
   */
  public constructor(
    state: GameState,
    private readonly factory: EntityFactory,
    private readonly plan: SpawnPlan,
  ) {
    this.spawners = (state.map?.features ?? [])
      .filter(
        (feature): feature is TeamFeature =>
          feature.team !== 'neutral' && plan.waves[feature.kind] !== undefined,
      )
      .sort((a, b) => compareById(a.id, b.id));
  }

  /** Spawns every horde due this tick, in spawner id order. */
  public update({ state }: SystemContext): void {
    const routes = state.routes;
    if (routes === null) {
      return;
    }
    const { tickRate, match } = state.config;
    if (state.tick === 0) {
      for (const team of PLAYABLE_TEAMS) {
        const stronghold = this.spawners.find(
          (feature) => feature.kind === 'stronghold' && feature.team === team,
        );
        for (
          let index = 0;
          stronghold !== undefined && index < match.initialHordesPerTeam;
          index += 1
        ) {
          const lane = routes.lanes[index % routes.lanes.length];
          if (lane !== undefined) {
            this.spawnHorde(
              state,
              routes,
              team,
              stronghold.position,
              lane.id,
              this.plan.openingWave,
            );
          }
        }
      }
    }
    const sinceCountdown = state.tick - Math.round(match.countdownSeconds * tickRate);
    if (sinceCountdown < 0) {
      return;
    }
    for (const spawner of this.spawners) {
      const team = spawner.team;
      for (const wave of this.plan.waves[spawner.kind] ?? []) {
        if (sinceCountdown % Math.max(1, Math.round(wave.everySeconds * tickRate)) !== 0) {
          continue;
        }
        const lane =
          wave.lane === 'own-lane' ? spawner.laneId : assessLanes(state, team, this.plan.weights);
        if (lane !== undefined) {
          this.spawnHorde(state, routes, team, spawner.position, lane, wave);
        }
      }
    }
  }

  /** Spawns one horde and its record in a grid around `origin`, clipped to the team's unit cap. */
  private spawnHorde(
    state: GameState,
    routes: LaneRoutes,
    team: PlayableTeam,
    origin: Vec2,
    lane: string,
    wave: OpeningWaveDefinition,
  ): void {
    const requested = state.config.match.hordeSizes[wave.weightClass];
    const room = state.config.limits.maxUnitsPerTeam - state.entities.countOnTeam(team, Unit);
    const count = Math.min(requested, Math.max(0, room));
    state.recordSpawnRequest(team, requested, count);
    if (count === 0) {
      return;
    }
    const kind = this.plan.definitions.get(wave.mobId).kind;
    const { spawnSpacing, spawnColumns } = this.plan.steering;
    const columns = Math.min(count, spawnColumns);
    const rows = Math.ceil(count / columns);
    const memberIds: EntityId[] = [];
    for (let member = 0; member < count; member += 1) {
      const position = {
        x: origin.x + ((member % columns) - (columns - 1) / 2) * spawnSpacing,
        y: origin.y + (Math.floor(member / columns) - (rows - 1) / 2) * spawnSpacing,
      };
      const entity = this.factory.create(kind, wave.mobId, { team, position });
      state.entities.add(entity);
      memberIds.push(entity.id);
    }
    const horde = state.hordes.add({
      id: state.hordes.nextId(),
      team,
      weightClass: wave.weightClass,
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
