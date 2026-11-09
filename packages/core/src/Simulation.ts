import { AiSystem } from './ai/AiSystem';
import type { AiMemory } from './content/ai/ai.types';
import {
  createDefaultControllerRegistry,
  type ControllerRegistry,
} from './ai/defaultControllerRegistry';
import { applyCommand } from './commands/applyCommand';
import type { Command } from './commands/Command.types';
import type { CommandContext, CommandHandlers } from './commands/CommandHandler.types';
import { CommandQueue } from './commands/CommandQueue';
import { createDefaultCommandHandlers } from './commands/defaultCommandHandlers';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from './config/matchPhases';
import { validateGameConfig } from './config/validateGameConfig';
import { SCORING } from './content/match/scoring';
import { DefaultInvariantRunner } from './diagnostics/DefaultInvariantRunner';
import { RELEASE_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import type { LogContext, Logger } from './diagnostics/Logger.types';
import { makeLogRecord } from './diagnostics/makeLogRecord';
import { recentContext } from './diagnostics/recentContext';
import { REPLAY_CHECKPOINT_EVERY } from './diagnostics/Replay.constants';
import { AGGRO_RULES } from './content/ai/aggro/aggroRules';
import { AI_CADENCE } from './content/ai/cadence';
import { LANE_ASSESSMENT_WEIGHTS } from './content/ai/laneAssessmentWeights';
import { ROVER_TACTICS } from './content/ai/rover';
import { LEGEND_KIND_IDS } from './content/legends/legendKinds';
import type { MapDefinition } from './content/maps/maps.types';
import type { MapObject } from './content/maps/mapObjects.types';
import type { GameConfig } from './config/GameConfig.types';
import { AStarPathfinder } from './map/AStarPathfinder';
import { RETREAT_STRUCTURES } from './content/ai/botLaner';
import { BOT_DIFFICULTIES } from './content/ai/difficulties/botDifficulties';
import { RANKS_FORMATION } from './content/mobs/formations/ranks';
import { assignLanes } from './state/assignLanes';
import { formationSlot } from './state/formationSlot';
import { unitClassOf } from './content/ai/unitClasses';
import { SPACE_CELL_SIZE } from './content/ai/hordeSteering';
import type { ContentCatalogue } from './content/ContentCatalogue';
import { loadDefaultContent } from './content/loadDefaultContent';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { compareById } from './utils/compareById';
import { MAP_FEATURE_DEFINITIONS } from './content/maps/mapFeatureDefinitions';
import type { LevelCurveDefinition } from './content/progression/progression.types';
import { loadLevelCurves } from './content/progression/loadLevelCurves';
import { XP_SOURCES } from './content/progression/xpSources';
import { loadWeapons } from './content/weapons/loadWeapons';
import { ZONE_DEFINITIONS, ZONE_PLACEMENTS } from './content/zones/zoneCatalogue';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { EntityFactory } from './entities/EntityFactory';
import { createDefaultMatchDirector } from './match/defaultMatchDirector';
import { MatchTimeline } from './match/MatchTimeline';
import type { DefinitionSource, WeaponSource } from './entities/EntityFactory.types';
import { Legend } from './entities/Legend';
import { Unit } from './entities/Unit';
import type { GameEventHandler, GameEventType, Unsubscribe } from './state/GameEvents.types';
import { GameState } from './state/GameState';
import { MatchWorld } from './state/MatchWorld';
import type { Snapshot } from './state/Snapshot.types';
import { StateHasher } from './state/StateHasher';
import type { Replay, ReplaySetup, RosterSlot, SimulationOptions } from './Simulation.types';
import { SpaceIndex } from './physics/SpaceIndex';
import { WorldMap } from './map/WorldMap';
import { zoneAreaOf } from './map/zoneArea';
import { DefaultSystemPipeline } from './systems/DefaultSystemPipeline';
import type { SystemContext } from './systems/System.types';
import { SystemPipeline } from './systems/SystemPipeline';
import { WorldObjectStore } from './state/WorldObjectStore';
import { MAP_OBJECT_DEFINITIONS } from './content/maps/mapObjectDefinitions';
import { CollisionSystem } from './systems/CollisionSystem';
import type { PlayableTeam } from './teams/teams.types';
import type { Vec2 } from './utils/geometry.types';
import { PLAYABLE_TEAMS } from './teams/playableTeams';

/**
 * The deterministic simulation of one match, and the only thing the client drives
 * (architecture 03 §6). Same config, seed and commands give the same match, tick for tick.
 * Composition root of core: it builds the state, the command registry and the system pipeline,
 * and, with the default pipeline, the match director (started here, so the countdown covers tick 0).
 */
export class Simulation {
  private readonly state: GameState;
  /** Commands the bots queued during the last step (`AiSystem`). A replay regenerates them. */
  private readonly botQueue = new CommandQueue();
  /** Commands from `enqueueCommand` (player, developer menu). Each one enters the replay log. */
  private readonly externalQueue = new CommandQueue();
  private readonly handlers: CommandHandlers = createDefaultCommandHandlers();
  private readonly commandContext: CommandContext;
  private readonly systemContext: SystemContext;
  private readonly pipeline: SystemPipeline;
  private readonly hasher = new StateHasher();
  /**
   * Every command from `enqueueCommand`, with the tick it applied in (ADR 0025 §4, DEC-156). Not
   * hashed.
   */
  private readonly commandLog: Replay['commands'][number][] = [];
  /** `hash()` at tick 0 and every `REPLAY_CHECKPOINT_EVERY` ticks, ascending. Not hashed. */
  private readonly checkpoints: Replay['checkpoints'][number][] = [];
  /**
   * What the match was built with, copied into every exported replay. A crash report's replay
   * keeps the generated map and map objects inline (DEC-152); revisit at the Phase 5 replay store.
   */
  private readonly setup: ReplaySetup;

  /** The level curves `ProgressionSystem` levels Legends along; the snapshot reports XP on them. */
  private readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'has' | 'get'>;

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
    mapObjects,
    levelCurves,
    roster = [],
    weapons,
  }: SimulationOptions) {
    const validConfig = validateGameConfig(config);
    const timeline = MatchTimeline.resolve(validConfig);
    this.setup = {
      seed,
      config: validConfig,
      ...(map === undefined ? {} : { map }),
      ...(mapObjects === undefined ? {} : { mapObjects }),
      ...(roster.length === 0 ? {} : { roster }),
    };
    const { space, world, paths } = Simulation.buildWorld(map, validConfig, mapObjects);
    // Without the default pipeline no director runs, so no mark would ever fire: list none.
    const schedule = systems === undefined ? timeline.schedule() : [];
    this.state = new GameState(validConfig, seed, world, { space, paths }, schedule);
    const { tickRate } = this.state.config;
    const curves = levelCurves ?? loadLevelCurves();
    this.curves = curves;
    const weaponSource = weapons ?? loadWeapons(tickRate);
    const controllers = Simulation.createControllers();
    const units = content ?? Simulation.defaultContent(tickRate, curves, controllers, weaponSource);
    const objectsById = new Map(
      Object.values(MAP_OBJECT_DEFINITIONS).map((definition) => [definition.id, definition]),
    );
    const definitions = {
      has: (id: string): boolean =>
        objectsById.has(id) || ZONE_DEFINITIONS.has(id) || units.has(id),
      get: (id: string) =>
        objectsById.get(id) ??
        (ZONE_DEFINITIONS.has(id) ? ZONE_DEFINITIONS.get(id) : units.get(id)),
    };
    // One factory for commands and spawning, so entity ids come from one counter.
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      Simulation.withStructures(definitions),
      undefined,
      weaponSource,
    );
    Simulation.spawnStructures(this.state, factory);
    this.state.indexStructures();
    this.commandContext = { state: this.state, factory };
    if (mapObjects !== undefined && map === undefined)
      throw new Error('Map objects require a generated map');
    if (mapObjects !== undefined) {
      this.state.worldObjects = new WorldObjectStore(
        mapObjects,
        this.commandContext.factory,
        this.state.entities,
        MAP_OBJECT_DEFINITIONS,
      );
      this.state.events.on('entity-removed', ({ entityId }) =>
        this.state.worldObjects?.removed(entityId),
      );
    }
    this.systemContext = { state: this.state, logger };
    if (systems === undefined) {
      // Before any Legend spawns (`spawnRoster`), so `Scoring` hears each one's `entity-spawned`
      // and gives it a row.
      const director = createDefaultMatchDirector({
        state: this.state,
        timeline,
        debug,
        logger,
        scoring: SCORING,
      });
      this.pipeline = new DefaultSystemPipeline({
        invariants: new DefaultInvariantRunner({
          debug,
          logger,
          curves,
          phaseOrder: MATCH_PHASES,
          terminalPhases: TERMINAL_MATCH_PHASES,
        }),
        state: this.state,
        progression: { units, curves, xpSources: XP_SOURCES },
        director,
        hordes: {
          factory,
          space,
          collisions:
            map === undefined || mapObjects === undefined
              ? []
              : [new CollisionSystem(map, mapObjects)],
          decide: [
            new AiSystem(this.state, controllers, AI_CADENCE, (command) => {
              this.botQueue.enqueue(command);
            }),
          ],
        },
      });
      director.start(this.state);
    } else {
      this.pipeline = new SystemPipeline(systems);
    }
    Simulation.spawnRoster(this.state, factory, roster, controllers, logger);
    Simulation.spawnZones(this.state, factory);
    this.state.events.on('command-rejected', ({ command, reason }) => {
      logger.log(
        makeLogRecord('INFO', 'core.commands', `Rejected ${command.type}: ${reason}`, {
          tick: this.state.tick,
          event: { name: 'command-rejected', attributes: { commandType: command.type, reason } },
        }),
      );
    });
    this.recordCheckpoint();
  }

  /** Number of ticks completed. */
  public get tick(): number {
    return this.state.tick;
  }

  /**
   * Queues `command`; it is applied at the start of the next `step()`, which also enters it in the
   * replay's command log. Bot commands bypass this method, so they stay out of the log: a replay
   * regenerates them from the seed.
   */
  public enqueueCommand(command: Command): void {
    this.externalQueue.enqueue(command);
  }

  /**
   * Advances exactly one tick: applies the bots' queued commands, then the external ones (each
   * logged with this tick), each in queue order; runs the systems in order, counts the tick, records
   * a replay checkpoint every `REPLAY_CHECKPOINT_EVERY` ticks and emits `tick-completed`. A replay
   * feeds the external commands before the step, after the bots queued theirs, and this order is
   * the one it reproduces, also for a command enqueued during a step (DEC-156). A command enqueued
   * while these apply waits for the next step.
   */
  public step(): void {
    const decided = this.botQueue.drain();
    const external = this.externalQueue.drain();
    for (const command of decided) {
      this.apply(command);
    }
    for (const command of external) {
      this.commandLog.push({ tick: this.state.tick, command });
      this.apply(command);
    }
    this.pipeline.run(this.systemContext);
    this.state.advanceTick();
    if (this.state.tick % REPLAY_CHECKPOINT_EVERY === 0) {
      this.recordCheckpoint();
    }
    this.state.events.emit('tick-completed', { tick: this.state.tick });
  }

  /** The current state as a structured-clone-safe snapshot. */
  public snapshot(): Snapshot {
    return this.state.snapshot(this.curves);
  }

  /** Subscribes to a game event; returns the function that unsubscribes. */
  public on<K extends GameEventType>(type: K, handler: GameEventHandler<K>): Unsubscribe {
    return this.state.events.on(type, handler);
  }

  /** A 32-bit fingerprint of the current state; equal runs give equal hashes. */
  public hash(): number {
    return this.hasher.hash(this.state);
  }

  /** `units` plus the structure definitions, so one factory builds both (architecture 04 §6). */
  private static withStructures(units: DefinitionSource): DefinitionSource {
    return {
      has: (id) => units.has(id) || STRUCTURE_DEFINITIONS.has(id),
      get: (id) => (units.has(id) ? units.get(id) : STRUCTURE_DEFINITIONS.get(id)),
    };
  }

  /**
   * Builds the map's structures, in feature id order, before anything else spawns (architecture
   * 07 §1): every feature whose definition is a structure becomes that structure, with its team
   * and lane. Features without a structure definition (walls, turrets, camps) stay map data.
   */
  private static spawnStructures(state: GameState, factory: EntityFactory): void {
    const features = [...(state.world?.definition.features ?? [])].sort((a, b) =>
      compareById(a.id, b.id),
    );
    for (const { definitionId, position, team, laneId } of features) {
      if (STRUCTURE_DEFINITIONS.has(definitionId)) {
        const { kind } = STRUCTURE_DEFINITIONS.get(definitionId);
        const placement = { position, team, ...(laneId !== undefined && { laneId }) };
        state.entities.add(factory.create(kind, definitionId, placement));
      }
    }
  }

  /**
   * The match so far as a `Replay` (architecture 03 §6, ADR 0025 §4): what it was built with (seed,
   * config, and the map, map objects and roster when it had them), a copy of the command log and
   * the checkpoints recorded so far. Plain data. It does not hash now: after a throw inside
   * `step()` the state holds half a tick, and that hash cannot be reproduced.
   */
  public exportReplay(): Replay {
    return {
      ...this.setup,
      commands: [...this.commandLog],
      checkpoints: [...this.checkpoints],
    };
  }

  /** The last applied commands (players' and bots') and the last events, oldest first (15 §5). */
  public recentContext(): LogContext {
    return recentContext(this.state);
  }

  private apply(command: Command): void {
    this.state.recordCommand(command);
    applyCommand(command, this.handlers, this.commandContext);
  }

  private recordCheckpoint(): void {
    this.checkpoints.push({ tick: this.state.tick, hash: this.hash() });
  }

  /**
   * Spawns the roster's Legends (architecture 18 §8, MS-20): each team's laners, in roster order,
   * go to the lane with the fewest Legends, lowest index first, and stand in ranks behind their own
   * end of it; Rovers start at their Stronghold. A bot gets its controller (a laner's with the lane
   * in its brain's memory); the human slot gets none (a human plays it), and its Legend's id goes
   * to `state.match.humanLegendId`. Runs once the match director exists, so its listeners hear
   * every `entity-spawned` (plan §4.4). The roster is setup, so nothing is queued or recorded: a
   * replay rebuilds it. A human slot whose definition does not exist or is not a Legend logs ERROR
   * `core.match` and does not spawn, and the match runs on without a human: the class comes from
   * saved data and can be stale (ADR 0023).
   *
   * @throws Error when there is a roster but no map, more than one human slot, a human slot off
   *   `playerTeam`, a team's slots do not fit under `legendsPerTeam` or the Unit cap, its laners do
   *   not fit under `legendsPerLane`, or a bot's controller or difficulty does not exist or its
   *   definition is not a Legend (checked before anything spawns).
   */
  private static spawnRoster(
    state: GameState,
    factory: EntityFactory,
    roster: readonly RosterSlot[],
    controllers: ControllerRegistry,
    logger: Logger,
  ): void {
    if (roster.length === 0) {
      return;
    }
    const routes = state.world?.routes ?? null;
    if (routes === null) {
      throw new Error(
        'A roster needs a map: its Legends spawn on its lanes and at its Strongholds.',
      );
    }
    const human = Simulation.humanSlotOf(roster, state.config.match.playerTeam);
    AiSystem.assertRegistered(
      roster.flatMap((slot, index) =>
        slot.pilot === 'bot'
          ? [
              {
                id: `roster slot ${String(index)}`,
                controller: Simulation.controllerOf(slot),
                aiProfile: slot.difficulty,
              },
            ]
          : [],
      ),
      controllers,
    );
    roster.forEach((slot, index) => {
      const reason = slot.pilot === 'bot' ? Simulation.legendRefusal(factory, slot) : null;
      if (reason !== null) {
        throw new Error(
          `Roster slot ${String(index)} (a ${slot.team} bot) cannot spawn "${slot.definitionId}": ${reason}.`,
        );
      }
    });
    const refusal = human === undefined ? null : Simulation.legendRefusal(factory, human);
    // A refused human slot still counts against the caps below, but takes no lane and no spawn.
    const spawning = refusal === null ? roster : roster.filter((slot) => slot !== human);
    const plans = Simulation.planLanes(
      state,
      roster,
      spawning,
      routes.lanes.map(({ id }) => id),
    );
    if (human !== undefined && refusal !== null) {
      logger.log(
        makeLogRecord(
          'ERROR',
          'core.match',
          `The human's Legend "${human.definitionId}" did not spawn: ${refusal}.`,
          { attributes: { definitionId: human.definitionId, reason: refusal } },
        ),
      );
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
        Simulation.spawnSlot(state, factory, slot, { x: at.x, y: at.y }, { lane });
      });
    }
    for (const slot of spawning.filter(({ role }) => role === 'rover')) {
      const forWhom = slot.pilot === 'human' ? "the human's Legend" : `the ${slot.team} Rover`;
      const position = Simulation.strongholdOf(state, slot.team, forWhom);
      Simulation.spawnSlot(state, factory, slot, position, {});
    }
  }

  /**
   * Each team's laners (of `spawning`) and the lane of each, in `PLAYABLE_TEAMS` order. Every lane
   * is assigned before anything spawns, so a roster that does not fit spawns nothing.
   *
   * @throws Error when a team's slots (all of `roster`) do not fit under `legendsPerTeam` or the
   *   Unit cap, or its laners do not fit under `legendsPerLane`.
   */
  private static planLanes(
    state: GameState,
    roster: readonly RosterSlot[],
    spawning: readonly RosterSlot[],
    laneIds: readonly string[],
  ): readonly {
    readonly team: PlayableTeam;
    readonly laners: readonly RosterSlot[];
    readonly lanes: readonly string[];
  }[] {
    const { legendsPerTeam, legendsPerLane } = state.config.match;
    const { maxUnitsPerTeam } = state.config.limits;
    return PLAYABLE_TEAMS.map((team) => {
      const size = roster.filter((slot) => slot.team === team).length;
      if (size > legendsPerTeam) {
        throw new Error(
          `The ${team} roster has ${String(size)} Legends; match.legendsPerTeam allows ${String(legendsPerTeam)}.`,
        );
      }
      // Legends are Units, so the roster also fits under the Unit cap (as dev spawns do).
      const units = state.entities.countOnTeam(team, Unit) + size;
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
   * The roster's human slot; `undefined` in sim mode (no human).
   *
   * @throws Error when the roster has more than one human slot, or its human slot is not on
   *   `playerTeam`.
   */
  private static humanSlotOf(
    roster: readonly RosterSlot[],
    playerTeam: PlayableTeam,
  ): RosterSlot | undefined {
    const humans = roster.filter(({ pilot }) => pilot === 'human');
    if (humans.length > 1) {
      throw new Error(
        `The roster has ${String(humans.length)} human slots; a match has at most one human.`,
      );
    }
    const [human] = humans;
    if (human !== undefined && human.team !== playerTeam) {
      throw new Error(
        `The roster's human slot is on the ${human.team} team; match.playerTeam is ${playerTeam}.`,
      );
    }
    return human;
  }

  /**
   * Spawns one zone per map feature that places one (`ZONE_PLACEMENTS`): a capture point where
   * each lane crosses the centre line, the middle one in the Cathedral (architecture 07 §7), each
   * covering its building's floor (DEC-145 (a)). They come from the map alone, so a replay (seed,
   * config and commands) rebuilds them.
   */
  private static spawnZones(state: GameState, factory: EntityFactory): void {
    const map = state.world?.definition;
    if (map === undefined) {
      return;
    }
    for (const feature of map.features) {
      const definitionId = ZONE_PLACEMENTS[feature.kind];
      if (definitionId === undefined) {
        continue;
      }
      const { kind } = factory.definitions.get(definitionId);
      const entity = factory.create(kind, definitionId, {
        position: feature.position,
        team: feature.team,
        area: zoneAreaOf(map, feature),
      });
      state.entities.add(entity);
      state.events.emit('entity-spawned', { entityId: entity.id, kind, team: feature.team });
    }
  }

  /** The controller a bot of `slot`'s role plays with: a Rover's or a lane bot's. */
  private static controllerOf(slot: RosterSlot): 'rover' | 'bot-legend' {
    return slot.role === 'rover' ? 'rover' : 'bot-legend';
  }

  /**
   * Spawns one roster slot's Legend at `position` on its team and announces it: a bot with its
   * controller (whose brain starts with `memory`), the human with none, recorded as the human's
   * Legend (DEC-172).
   */
  private static spawnSlot(
    state: GameState,
    factory: EntityFactory,
    slot: RosterSlot,
    position: Vec2,
    memory: AiMemory,
  ): void {
    const { kind } = factory.definitions.get(slot.definitionId);
    const entity = factory.create(kind, slot.definitionId, {
      position,
      team: slot.team,
      ...(slot.pilot === 'bot' && {
        controller: {
          controllerId: Simulation.controllerOf(slot),
          profileId: slot.difficulty,
          memory,
        },
      }),
    });
    state.entities.add(entity);
    state.events.emit('entity-spawned', {
      entityId: entity.id,
      kind: entity.kind,
      team: slot.team,
    });
    if (slot.pilot === 'human') {
      state.match.seatHuman(entity.id);
    }
  }

  /**
   * Where `team`'s Stronghold stands on the map: where its Rovers (the human's Legend among them)
   * start.
   *
   * @throws Error naming `forWhom` when the map has no Stronghold for `team`.
   */
  private static strongholdOf(state: GameState, team: PlayableTeam, forWhom: string): Vec2 {
    const stronghold = state.world?.definition.features.find(
      (feature) => feature.kind === 'stronghold' && feature.team === team,
    );
    if (stronghold === undefined) {
      throw new Error(`The map has no ${team} Stronghold for ${forWhom}.`);
    }
    return { x: stronghold.position.x, y: stronghold.position.y };
  }

  /**
   * Why `slot`'s Legend cannot spawn: its `definitionId` names no definition, or one whose kind is
   * not a Legend; `null` when it can. A bad bot slot throws; a bad human slot is logged (DEC-173).
   */
  private static legendRefusal(
    factory: EntityFactory,
    { definitionId }: RosterSlot,
  ): 'unknown-definition' | 'not-a-legend' | null {
    if (!factory.definitions.has(definitionId)) {
      return 'unknown-definition';
    }
    const { kind } = factory.definitions.get(definitionId);
    return factory.registry.get(kind)?.prototype instanceof Legend ? null : 'not-a-legend';
  }

  /**
   * The map's spatial pieces: the match world (its one walkability grid shared by the lane flow
   * fields and A\* for Legends), the neighbour index and A\*. All `null` without a map. With
   * `mapObjects`, the grid also blocks what the collision system blocks (06 §6): every blocking
   * object's footprints, minus its passages. A feature whose object is walkable (a Stronghold's
   * floor, whose walls and furniture are objects of their own) is not stamped; other blocking
   * features keep their stamp, which also fills a tower's hollow core so no path ends in a pocket
   * the walls close off.
   */
  private static buildWorld(
    map: MapDefinition | undefined,
    config: GameConfig,
    mapObjects: readonly MapObject[] = [],
  ): {
    readonly space: SpaceIndex | null;
    readonly world: MatchWorld | null;
    readonly paths: AStarPathfinder | null;
  } {
    if (map === undefined) {
      return { space: null, world: null, paths: null };
    }
    const walkable = new Set(
      mapObjects.filter(({ isBlocking }) => !isBlocking).map(({ id }) => id),
    );
    const grid = WorldMap.fromDefinition(
      { ...map, features: map.features.filter(({ id }) => !walkable.has(id)) },
      config.map.navCellSize,
      (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
    );
    for (const object of mapObjects.filter(({ isBlocking }) => isBlocking)) {
      for (const footprint of object.footprints) {
        grid.stampFootprint(footprint, object.passages);
      }
    }
    return {
      space: new SpaceIndex(map.width, map.height, SPACE_CELL_SIZE),
      world: new MatchWorld(map, grid),
      paths: new AStarPathfinder(grid, {
        maxExpansions: config.map.pathMaxExpansions,
        snapCells: config.map.pathSnapCells,
      }),
    };
  }

  /** Every controller, with the shipped content it reads (architecture 11 §2). */
  private static createControllers(): ControllerRegistry {
    const bots = { difficulties: BOT_DIFFICULTIES, retreatTo: RETREAT_STRUCTURES };
    return createDefaultControllerRegistry({
      minion: { aggro: AGGRO_RULES, classOf: unitClassOf },
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
