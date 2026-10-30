import { AiSystem } from './ai/AiSystem';
import {
  createDefaultControllerRegistry,
  type ControllerRegistry,
} from './ai/defaultControllerRegistry';
import { applyCommand } from './commands/applyCommand';
import type { Command } from './commands/Command.types';
import type { CommandContext, CommandHandlers } from './commands/CommandHandler.types';
import { CommandQueue } from './commands/CommandQueue';
import { createDefaultCommandHandlers } from './commands/defaultCommandHandlers';
import { validateGameConfig } from './config/validateGameConfig';
import { DefaultInvariantRunner } from './diagnostics/DefaultInvariantRunner';
import { RELEASE_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { makeLogRecord } from './diagnostics/makeLogRecord';
import { AGGRO_RULES } from './content/ai/aggro/aggroRules';
import { AI_CADENCE } from './content/ai/cadence';
import { LANE_ASSESSMENT_WEIGHTS } from './content/ai/laneAssessmentWeights';
import { ROVER_TACTICS } from './content/ai/rover';
import { LEGEND_KIND_IDS } from './content/legends/legendKinds';
import type { MapDefinition } from './content/maps/maps.types';
import { MAP_FEATURE_DEFINITIONS } from './content/maps/mapFeatureDefinitions';
import type { GameConfig } from './config/GameConfig.types';
import { AStarPathfinder } from './map/AStarPathfinder';
import { WorldMap } from './map/WorldMap';
import { RETREAT_STRUCTURES } from './content/ai/botLaner';
import { BOT_DIFFICULTIES } from './content/ai/difficulties/botDifficulties';
import { RANKS_FORMATION } from './content/mobs/formations/ranks';
import { assignLanes } from './state/assignLanes';
import { formationSlot } from './state/formationSlot';
import { unitClassOf } from './content/ai/unitClasses';
import { FORMATIONS } from './content/mobs/formations/formations';
import { SPACE_CELL_SIZE } from './content/ai/hordeSteering';
import type { ContentCatalogue } from './content/ContentCatalogue';
import { loadDefaultContent } from './content/loadDefaultContent';
import type { LevelCurveDefinition } from './content/progression/progression.types';
import { loadLevelCurves } from './content/progression/loadLevelCurves';
import { XP_SOURCES } from './content/progression/xpSources';
import { loadWeapons } from './content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { EntityFactory } from './entities/EntityFactory';
import type { DefinitionSource, Placement, WeaponSource } from './entities/EntityFactory.types';
import type { GameEventHandler, GameEventType, Unsubscribe } from './state/GameEvents.types';
import { GameState } from './state/GameState';
import type { Snapshot } from './state/Snapshot.types';
import { StateHasher } from './state/StateHasher';
import type { RosterSlot, SimulationOptions } from './Simulation.types';
import { SpaceIndex } from './physics/SpaceIndex';
import { DefaultSystemPipeline } from './systems/DefaultSystemPipeline';
import type { SystemContext } from './systems/System.types';
import { SystemPipeline } from './systems/SystemPipeline';

/**
 * The deterministic simulation of one match, and the only thing the client drives
 * (architecture 03 §6). Same config, seed and commands give the same match, tick for tick.
 * Composition root of core: it builds the state, the command registry and the system pipeline.
 */
export class Simulation {
  private readonly state: GameState;
  private readonly queue = new CommandQueue();
  private readonly handlers: CommandHandlers = createDefaultCommandHandlers();
  private readonly commandContext: CommandContext;
  private readonly systemContext: SystemContext;
  private readonly pipeline: SystemPipeline;
  private readonly hasher = new StateHasher();

  /**
   * Creates a match from its options (architecture 03 §6).
   *
   * @throws ConfigValidationError when `options.config` is invalid, before anything runs.
   */
  public constructor({
    config,
    seed,
    logger,
    systems,
    debug = RELEASE_DEBUG_CONFIG,
    content,
    map,
    levelCurves,
    roster = [],
    weapons,
  }: SimulationOptions) {
    const valid = validateGameConfig(config);
    const { space, world, paths } = Simulation.buildWorld(map, valid);
    this.state = new GameState(valid, seed, map ?? null, { space, paths });
    const { tickRate } = this.state.config;
    const curves = levelCurves ?? loadLevelCurves();
    const weaponSource = weapons ?? loadWeapons(tickRate);
    const controllers = Simulation.createControllers();
    const units = content ?? Simulation.defaultContent(tickRate, curves, controllers, weaponSource);
    // One factory for commands and spawning, so entity ids come from one counter.
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      units,
      undefined,
      weaponSource,
    );
    this.commandContext = { state: this.state, factory };
    Simulation.spawnRoster(this.state, factory, roster, controllers);
    this.systemContext = { state: this.state, logger };
    this.pipeline =
      systems === undefined
        ? new DefaultSystemPipeline(
            new DefaultInvariantRunner(debug, logger, curves),
            this.state,
            { units, curves, xpSources: XP_SOURCES },
            {
              factory,
              space,
              world,
              decide: [
                new AiSystem(this.state, controllers, AI_CADENCE, (command) => {
                  this.queue.enqueue(command);
                }),
              ],
            },
          )
        : new SystemPipeline(systems);
    this.state.events.on('command-rejected', ({ command, reason }) => {
      logger.log(
        makeLogRecord('INFO', 'core.commands', `Rejected ${command.type}: ${reason}`, {
          tick: this.state.tick,
          event: { name: 'command-rejected', attributes: { commandType: command.type, reason } },
        }),
      );
    });
  }

  /** Number of ticks completed. */
  public get tick(): number {
    return this.state.tick;
  }

  /** Queues `command`; it is applied at the start of the next `step()`. */
  public enqueueCommand(command: Command): void {
    this.queue.enqueue(command);
  }

  /**
   * Advances exactly one tick: records and applies the queued commands in order, runs the systems
   * in order, counts the tick and emits `tick-completed`.
   */
  public step(): void {
    for (const command of this.queue.drain()) {
      this.state.recordCommand(command);
      applyCommand(command, this.handlers, this.commandContext);
    }
    this.pipeline.run(this.systemContext);
    this.state.advanceTick();
    this.state.events.emit('tick-completed', { tick: this.state.tick });
  }

  /** The current state as a structured-clone-safe snapshot. */
  public snapshot(): Snapshot {
    return this.state.snapshot();
  }

  /** Subscribes to a game event; returns the function that unsubscribes. */
  public on<K extends GameEventType>(type: K, handler: GameEventHandler<K>): Unsubscribe {
    return this.state.events.on(type, handler);
  }

  /** A 32-bit fingerprint of the current state; equal runs give equal hashes. */
  public hash(): number {
    return this.hasher.hash(this.state);
  }

  /**
   * Spawns the bot Legends (architecture 18 §8, MS-20): each team's laners, in roster order, go
   * to the lane with the fewest Legends, lowest index first, and stand in ranks behind their own
   * end of it, with the lane in their brain's memory; Rovers start at their Stronghold.
   *
   * @throws Error when there are bots but no map, a team's laners do not fit under
   *   `legendsPerLane`, or a bot's controller or difficulty does not exist (checked before
   *   anything spawns).
   */
  private static spawnRoster(
    state: GameState,
    factory: EntityFactory,
    roster: readonly RosterSlot[],
    controllers: ControllerRegistry,
  ): void {
    if (roster.length === 0) {
      return;
    }
    const routes = state.routes;
    if (routes === null) {
      throw new Error('A roster needs a map: bot Legends play its lanes.');
    }
    const controllerOf = (slot: RosterSlot) => (slot.role === 'rover' ? 'rover' : 'bot-legend');
    AiSystem.assertRegistered(
      roster.map((slot, index) => ({
        id: `roster slot ${String(index)}`,
        controller: controllerOf(slot),
        aiProfile: slot.difficulty,
      })),
      controllers,
    );
    const laneIds = routes.lanes.map(({ id }) => id);
    const anchor = { x: 0, y: 0 };
    const forward = { x: 0, y: 0 };
    const at = { x: 0, y: 0 };
    // Every lane is assigned before anything spawns, so a roster that does not fit spawns nothing.
    const { legendsPerTeam } = state.config.match;
    const plans = (['light', 'dark'] as const).map((team) => {
      const size = roster.filter((slot) => slot.team === team).length;
      if (size > legendsPerTeam) {
        throw new Error(
          `The ${team} roster has ${String(size)} Legends; match.legendsPerTeam allows ${String(legendsPerTeam)}.`,
        );
      }
      const laners = roster.filter((slot) => slot.team === team && slot.role === 'laner');
      return {
        team,
        laners,
        lanes: assignLanes(laners.length, laneIds, state.config.match.legendsPerLane),
      };
    });
    for (const { team, laners, lanes } of plans) {
      const placed = new Map<string, number>();
      laners.forEach((slot, index) => {
        const lane = lanes[index] ?? '';
        const follower = placed.get(lane) ?? 0;
        placed.set(lane, follower + 1);
        routes.pose(lane, team, 0, anchor, forward);
        formationSlot(anchor, forward, follower, RANKS_FORMATION, at);
        Simulation.spawnBot(state, factory, slot, {
          position: { x: at.x, y: at.y },
          team,
          controller: {
            controllerId: controllerOf(slot),
            profileId: slot.difficulty,
            memory: { lane },
          },
        });
      });
    }
    Simulation.spawnRovers(state, factory, roster);
  }

  /**
   * Spawns the roster's Rovers at their team's Stronghold (11 §4.7): they take no lane (MS-20).
   *
   * @throws Error when a Rover's team has no Stronghold on the map.
   */
  private static spawnRovers(
    state: GameState,
    factory: EntityFactory,
    roster: readonly RosterSlot[],
  ): void {
    for (const slot of roster.filter(({ role }) => role === 'rover')) {
      const stronghold = state.map?.features.find(
        ({ kind, team }) => kind === 'stronghold' && team === slot.team,
      );
      if (stronghold === undefined) {
        throw new Error(`The map has no ${slot.team} Stronghold for the ${slot.team} Rover.`);
      }
      Simulation.spawnBot(state, factory, slot, {
        position: { x: stronghold.position.x, y: stronghold.position.y },
        team: slot.team,
        controller: { controllerId: 'rover', profileId: slot.difficulty, memory: {} },
      });
    }
  }

  /** Spawns one bot Legend of the roster and announces it. */
  private static spawnBot(
    state: GameState,
    factory: EntityFactory,
    slot: RosterSlot,
    placement: Placement,
  ): void {
    const entity = factory.create(slot.definitionId, slot.definitionId, placement);
    state.entities.add(entity);
    state.events.emit('entity-spawned', {
      entityId: entity.id,
      kind: entity.kind,
      team: slot.team,
    });
  }

  /**
   * The map's spatial pieces: the neighbour index, and one walkability grid shared by the lane
   * flow fields and A\* for Legends. All `null` without a map.
   */
  private static buildWorld(
    map: MapDefinition | undefined,
    config: GameConfig,
  ): {
    readonly space: SpaceIndex | null;
    readonly world: WorldMap | null;
    readonly paths: AStarPathfinder | null;
  } {
    if (map === undefined) {
      return { space: null, world: null, paths: null };
    }
    const world = WorldMap.fromDefinition(
      map,
      config.map.navCellSize,
      (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
    );
    return {
      space: new SpaceIndex(map.width, map.height, SPACE_CELL_SIZE),
      world,
      paths: new AStarPathfinder(world, {
        maxExpansions: config.map.pathMaxExpansions,
        snapCells: config.map.pathSnapCells,
      }),
    };
  }

  /** Every controller, with the shipped content it reads (architecture 11 §2). */
  private static createControllers(): ControllerRegistry {
    const bots = { difficulties: BOT_DIFFICULTIES, retreatTo: RETREAT_STRUCTURES };
    return createDefaultControllerRegistry({
      minion: { aggro: AGGRO_RULES, formations: FORMATIONS, classOf: unitClassOf },
      botLegend: bots,
      rover: {
        ...bots,
        tactics: ROVER_TACTICS,
        legendKinds: LEGEND_KIND_IDS,
        laneWeights: LANE_ASSESSMENT_WEIGHTS,
      },
    });
  }

  /** The shipped content, checked against the controllers before the match starts. */
  private static defaultContent(
    tickRate: number,
    curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'has'>,
    controllers: ControllerRegistry,
    weapons: WeaponSource,
  ): DefinitionSource {
    const catalogue = loadDefaultContent(tickRate, curves, weapons);
    AiSystem.assertRegistered(catalogue.all(), controllers);
    return catalogue;
  }
}
