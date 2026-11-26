import { AiSystem } from '../ai/AiSystem';
import type { ControllerRegistry } from '../ai/defaultControllerRegistry';
import type { AiMemory } from '../content/ai/ai.types';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import type { Logger } from '../diagnostics/Logger.types';
import { makeLogRecord } from '../diagnostics/makeLogRecord';
import type { EntityFactory } from '../entities/EntityFactory';
import { LegendSpawner } from '../entities/LegendSpawner';
import { Unit } from '../entities/Unit';
import type { RosterSlot } from '../Simulation.types';
import { assignLanes } from '../state/assignLanes';
import { formationSlot } from '../state/formationSlot';
import type { GameState } from '../state/GameState';
import { PLAYABLE_TEAMS } from '../teams/playableTeams';
import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { LanePlan } from './RosterSpawner.types';

/**
 * Spawns a match roster's Legends (architecture 18 §8, MS-20): each team's laners, in roster
 * order, go to the lane with the fewest Legends, lowest index first, and stand in ranks behind
 * their own end of it; Rovers start at their Stronghold (or a Duel's start point). A bot gets its
 * controller (a laner's with the lane in its brain's memory); the human slot gets none (a human
 * plays it), and its Legend's id goes to its team's seat in `state.match`. The roster is setup, so
 * nothing is queued or recorded: a replay rebuilds it.
 */
export class RosterSpawner {
  private readonly legends: LegendSpawner;

  /** Spawns into `state` through `factory`; bots are checked against `controllers`. */
  public constructor(
    private readonly state: GameState,
    factory: EntityFactory,
    private readonly controllers: ControllerRegistry,
    private readonly logger: Logger,
  ) {
    this.legends = new LegendSpawner(factory);
  }

  /**
   * Spawns `roster`. Runs once the match director exists, so its listeners hear every
   * `entity-spawned` (plan §4.4). A human slot whose definition does not exist or is not a Legend
   * logs ERROR `core.match` and does not spawn, and the match runs on without a human: the class
   * comes from saved data and can be stale (ADR 0023).
   *
   * @throws Error when there is a roster but no map, more than one human slot on a team, a lone
   *   human slot off `playerTeam`, a team's slots do not fit under `legendsPerTeam` or the Unit
   *   cap, its laners do not fit under `legendsPerLane`, or a bot's controller or difficulty does
   *   not exist or its definition is not a Legend (checked before anything spawns).
   */
  public spawn(
    roster: readonly RosterSlot[],
    duelStarts?: Readonly<Record<PlayableTeam, Vec2>>,
  ): void {
    if (roster.length === 0) {
      return;
    }
    const routes = this.state.world?.routes ?? null;
    if (routes === null) {
      throw new Error(
        'A roster needs a map: its Legends spawn on its lanes and at its Strongholds.',
      );
    }
    const humans = RosterSpawner.humanSlotsOf(roster, this.state.config.match.playerTeam);
    this.assertBotsCanSpawn(roster);
    const refusals = new Map(
      humans.map((human) => [human, this.legends.refusal(human.definitionId)]),
    );
    // A refused human slot still counts against the caps below, but takes no lane and no spawn.
    const spawning = roster.filter((slot) => (refusals.get(slot) ?? null) === null);
    const plans = this.planLanes(
      roster,
      spawning,
      routes.lanes.map(({ id }) => id),
    );
    for (const [human, refusal] of refusals) {
      if (refusal !== null) {
        this.logger.log(
          makeLogRecord(
            'ERROR',
            'core.match',
            `The human's Legend "${human.definitionId}" did not spawn: ${refusal}.`,
            { attributes: { definitionId: human.definitionId, reason: refusal } },
          ),
        );
      }
    }
    const anchor = { x: 0, y: 0 };
    const forward = { x: 0, y: 0 };
    const at = { x: 0, y: 0 };
    for (const { team, laners, lanes } of plans) {
      const placed = new Map<string, number>();
      laners.forEach((slot, index) => {
        const lane = lanes[index] ?? '';
        const follower = placed.get(lane) ?? 0;
        placed.set(lane, follower + 1);
        routes.pose(lane, team, 0, anchor, forward);
        formationSlot(anchor, forward, follower, RANKS_FORMATION, at);
        this.spawnSlot(slot, { x: at.x, y: at.y }, { lane });
      });
    }
    for (const slot of spawning.filter(({ role }) => role === 'rover')) {
      const forWhom = slot.pilot === 'human' ? "the human's Legend" : `the ${slot.team} Rover`;
      const position = duelStarts?.[slot.team] ?? this.strongholdOf(slot.team, forWhom);
      this.spawnSlot(slot, position, {});
    }
  }

  /**
   * @throws Error when a bot slot's controller or difficulty is not registered, or its definition
   *   does not exist or is not a Legend.
   */
  private assertBotsCanSpawn(roster: readonly RosterSlot[]): void {
    AiSystem.assertRegistered(
      roster.flatMap((slot, index) =>
        slot.pilot === 'bot'
          ? [
              {
                id: `roster slot ${String(index)}`,
                controller: RosterSpawner.controllerOf(slot),
                aiProfile: slot.difficulty,
              },
            ]
          : [],
      ),
      this.controllers,
    );
    roster.forEach((slot, index) => {
      const reason = slot.pilot === 'bot' ? this.legends.refusal(slot.definitionId) : null;
      if (reason !== null) {
        throw new Error(
          `Roster slot ${String(index)} (a ${slot.team} bot) cannot spawn "${slot.definitionId}": ${reason}.`,
        );
      }
    });
  }

  /**
   * Each team's laners (of `spawning`) and the lane of each, in `PLAYABLE_TEAMS` order. Every lane
   * is assigned before anything spawns, so a roster that does not fit spawns nothing.
   *
   * @throws Error when a team's slots (all of `roster`) do not fit under `legendsPerTeam` or the
   *   Unit cap, or its laners do not fit under `legendsPerLane`.
   */
  private planLanes(
    roster: readonly RosterSlot[],
    spawning: readonly RosterSlot[],
    laneIds: readonly string[],
  ): readonly LanePlan[] {
    const { legendsPerTeam, legendsPerLane } = this.state.config.match;
    const { maxUnitsPerTeam } = this.state.config.limits;
    return PLAYABLE_TEAMS.map((team) => {
      const size = roster.filter((slot) => slot.team === team).length;
      if (size > legendsPerTeam) {
        throw new Error(
          `The ${team} roster has ${String(size)} Legends; match.legendsPerTeam allows ${String(legendsPerTeam)}.`,
        );
      }
      // Legends are Units, so the roster also fits under the Unit cap (as dev spawns do).
      const units = this.state.entities.countOnTeam(team, Unit) + size;
      if (units > maxUnitsPerTeam) {
        throw new Error(
          `The ${team} roster would make ${String(units)} Units; limits.maxUnitsPerTeam allows ${String(maxUnitsPerTeam)}.`,
        );
      }
      const laners = spawning.filter((slot) => slot.team === team && slot.role === 'laner');
      return { team, laners, lanes: assignLanes(laners.length, laneIds, legendsPerLane) };
    });
  }

  /**
   * Spawns one roster slot's Legend at `position` on its team, facing the enemy Stronghold
   * (DEC-216 (6)), and announces it: a bot with its controller (whose brain starts with `memory`),
   * the human with none, recorded as the human's Legend (DEC-172).
   */
  private spawnSlot(slot: RosterSlot, position: Vec2, memory: AiMemory): void {
    const entity = this.legends.spawn(
      this.state,
      slot.definitionId,
      slot.team,
      position,
      slot.pilot === 'bot'
        ? {
            controllerId: RosterSpawner.controllerOf(slot),
            profileId: slot.difficulty,
            memory,
          }
        : undefined,
    );
    if (slot.pilot === 'human') {
      this.state.match.seatHuman(entity.id, slot.team);
    }
  }

  /**
   * Where `team`'s Stronghold stands on the map: where its Rovers (the human's Legend among them)
   * start.
   *
   * @throws Error naming `forWhom` when the map has no Stronghold for `team`.
   */
  private strongholdOf(team: PlayableTeam, forWhom: string): Vec2 {
    const stronghold = this.state.world?.strongholdOf(team);
    if (stronghold === undefined) {
      throw new Error(`The map has no ${team} Stronghold for ${forWhom}.`);
    }
    return stronghold;
  }

  /**
   * The roster's human slots, at most one per team (ADR 0016); empty in sim mode. A lone human
   * must be on `playerTeam`; with two, `playerTeam` is the team `humanLegendId` follows.
   *
   * @throws Error when a team has more than one human slot, or a lone human slot is not on
   *   `playerTeam`.
   */
  private static humanSlotsOf(
    roster: readonly RosterSlot[],
    playerTeam: PlayableTeam,
  ): readonly RosterSlot[] {
    const humans = roster.filter(({ pilot }) => pilot === 'human');
    for (const team of PLAYABLE_TEAMS) {
      const count = humans.filter((human) => human.team === team).length;
      if (count > 1) {
        throw new Error(
          `The ${team} team has ${String(count)} human slots; a team has at most one human.`,
        );
      }
    }
    const [lone] = humans;
    if (humans.length === 1 && lone !== undefined && lone.team !== playerTeam) {
      throw new Error(
        `The roster's human slot is on the ${lone.team} team; match.playerTeam is ${playerTeam}.`,
      );
    }
    return humans;
  }

  /** The controller a bot of `slot`'s role plays with: a Rover's or a lane bot's. */
  private static controllerOf(slot: RosterSlot): 'rover' | 'bot-legend' {
    return slot.role === 'rover' ? 'rover' : 'bot-legend';
  }
}
