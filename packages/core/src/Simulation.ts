import { ROVER_BOT } from './content/ai/difficulties/rover';
import { applyCommand } from './commands/applyCommand';
import type { Command } from './commands/Command.types';
import type { CommandContext, CommandHandlers } from './commands/CommandHandler.types';
import { CommandQueue } from './commands/CommandQueue';
import { createDefaultCommandHandlers } from './commands/defaultCommandHandlers';
import { validateGameConfig } from './config/validateGameConfig';
import { timelineFrameOf } from './config/timelineFrameOf';
import { DUEL_RULES } from './content/duel/duelRules';
import type { ContentCatalogue } from './content/ContentCatalogue';
import { MAP_OBJECT_DEFINITIONS } from './content/maps/mapObjectDefinitions';
import type { MapObject } from './content/maps/mapObjects.types';
import type { LevelCurveDefinition } from './content/progression/progression.types';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { RELEASE_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import type { LogContext, Logger } from './diagnostics/Logger.types';
import { makeLogRecord } from './diagnostics/makeLogRecord';
import { recentContext } from './diagnostics/recentContext';
import type { EntityFactory } from './entities/EntityFactory';
import { duelMapObjects } from './match/duelArena';
import { duelStartPoints } from './match/duelStartPoints';
import { MatchTimeline } from './match/MatchTimeline';
import { buildDefaultPipeline } from './simulation/buildDefaultPipeline';
import { buildMatchWorld } from './simulation/buildMatchWorld';
import { loadMatchContent } from './simulation/matchContent';
import { ReplayRecorder } from './simulation/ReplayRecorder';
import { RosterSpawner } from './simulation/RosterSpawner';
import { spawnStructures, spawnZones } from './simulation/spawnMapEntities';
import type { Replay, SimulationOptions } from './Simulation.types';
import type { EntityId } from './state/EntityStore.types';
import type { GameEventHandler, GameEventType, Unsubscribe } from './state/GameEvents.types';
import { GameState } from './state/GameState';
import type { Snapshot } from './state/Snapshot.types';
import { StateHasher } from './state/StateHasher';
import { WorldObjectStore } from './state/WorldObjectStore';
import type { SystemContext } from './systems/System.types';
import { SystemPipeline } from './systems/SystemPipeline';
import type { PlayableTeam } from './teams/teams.types';

/**
 * The deterministic simulation of one match, and the only thing the client drives
 * (architecture 03 §6). Same config, seed and commands give the same match, tick for tick.
 * Composition root of core: its constructor builds the state, the command registry and the
 * system pipeline from the parts in `simulation/` (the world, the map's entities, the content,
 * the default pipeline with its match director, the roster and the replay recorder); after that
 * it is a facade over one tick loop.
 */
export class Simulation {
  private readonly state: GameState;
  /** Commands the bots queued during the last step (`AiSystem`). A replay regenerates them. */
  private readonly botQueue = new CommandQueue();
  /** Commands from `enqueueCommand` (player, developer menu). Each one enters the replay log. */
  private readonly externalQueue = new CommandQueue();
  private readonly handlers: CommandHandlers = createDefaultCommandHandlers({
    rover: { controllerId: 'rover', profileId: ROVER_BOT.id, memory: {} },
  });
  private readonly commandContext: CommandContext;
  private readonly systemContext: SystemContext;
  private readonly pipeline: SystemPipeline;
  private readonly hasher = new StateHasher();
  private readonly replay: ReplayRecorder;
  /** The level curves `ProgressionSystem` levels Legends along; the snapshot reports XP on them. */
  private readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'has' | 'get'>;

  /**
   * Creates a match from its options (architecture 03 §6).
   *
   * @throws ConfigValidationError when `options.config` is invalid, before anything runs.
   */
  public constructor(options: SimulationOptions) {
    const { seed, logger, systems, map, roster = [], duel } = options;
    const { structures = STRUCTURE_DEFINITIONS, debug = RELEASE_DEBUG_CONFIG } = options;
    const config = validateGameConfig(options.config);
    const timeline = MatchTimeline.resolve(config);
    this.replay = new ReplayRecorder({ ...options, config });
    // A Duel keeps only the arena (DEC-36, DEC-348; SCRUM-445, SCRUM-446, SCRUM-450).
    const arena = duel === undefined ? undefined : DUEL_RULES.arena;
    const mapObjects = Simulation.matchMapObjects(options, arena);
    const { space, world, paths } = buildMatchWorld(map, config, mapObjects);
    // Without the default pipeline no director runs, so no mark would ever fire: list none.
    const schedule = systems === undefined ? timeline.schedule() : [];
    const { countdownEndTick } = timelineFrameOf(config);
    this.state = new GameState(
      config,
      seed,
      world,
      { space, paths },
      { schedule, countdownEndTick },
    );
    const duelStarts =
      duel === undefined ? undefined : duelStartPoints(map, DUEL_RULES.startOffset);
    if (duel !== undefined) this.state.match.startDuel(duel.killTarget);
    const content = loadMatchContent(this.state.config.tickRate, { ...options, structures });
    const { controllers, units, factory } = content;
    this.curves = content.curves;
    const omittedIds = arena?.omittedStructureIds ?? [];
    const owners = spawnStructures(this.state, factory, { structures, mapObjects, omittedIds });
    this.state.indexStructures();
    // Before the pipeline: zones can be guard homes, which SpawnSystem finds when it is built.
    const zones = arena?.hasCaptureObjectives === false ? [] : spawnZones(this.state, factory);
    this.commandContext = { state: this.state, factory };
    if (mapObjects !== undefined && map === undefined)
      throw new Error('Map objects require a generated map');
    if (mapObjects !== undefined) this.attachWorldObjects(mapObjects, factory, owners);
    this.systemContext = { state: this.state, logger };
    this.pipeline =
      systems === undefined
        ? buildDefaultPipeline({
            state: this.state,
            timeline,
            debug,
            logger,
            factory,
            space,
            units,
            curves: this.curves,
            structures,
            controllers,
            map,
            mapObjects,
            arena,
            duelStarts,
            guardPlans: options.guardPlans,
            onBotCommand: (command) => {
              this.botQueue.enqueue(command);
            },
          })
        : new SystemPipeline(systems);
    new RosterSpawner(this.state, factory, controllers, logger).spawn(roster, duelStarts);
    // Announced only now, so the director and the systems hear every spawn (plan §4.4).
    for (const zone of zones) {
      this.state.events.emit('entity-spawned', zone);
    }
    this.logRejectedCommands(logger);
    this.replay.recordCheckpointIfDue(this.state.tick, () => this.hash());
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
      this.replay.recordCommand(this.state.tick, command);
      this.apply(command);
    }
    this.pipeline.run(this.systemContext);
    this.state.advanceTick();
    this.replay.recordCheckpointIfDue(this.state.tick, () => this.hash());
    this.state.events.emit('tick-completed', { tick: this.state.tick });
  }

  /**
   * The Legend seated for `team`'s human slot (ADR 0016); `null` when that team has no human or
   * its Legend did not spawn. The server routes each seat's `intent` to this id.
   */
  public humanLegendIdOf(team: PlayableTeam): EntityId | null {
    return this.state.match.humanLegendIdOf(team);
  }

  /** The current state as a structured-clone-safe snapshot. */
  // ponytail: one shared snapshot for every seat; a per-seat Veil-filtered snapshot goes here.
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

  /**
   * The match so far as a `Replay` (architecture 03 §6, ADR 0025 §4): what it was built with (seed,
   * config, and the map, map objects and roster when it had them), a copy of the command log and
   * the checkpoints recorded so far. Plain data. It does not hash now: after a throw inside
   * `step()` the state holds half a tick, and that hash cannot be reproduced.
   */
  public exportReplay(): Replay {
    return this.replay.export();
  }

  /** The last applied commands (players' and bots') and the last events, oldest first (15 §5). */
  public recentContext(): LogContext {
    return recentContext(this.state);
  }

  private apply(command: Command): void {
    this.state.recordCommand(command);
    applyCommand(command, this.handlers, this.commandContext);
  }

  /**
   * Gives the state its `WorldObjectStore` over `mapObjects` (each blocking body owned by the
   * structure in `owners`) and drops an object from it when its entity is removed.
   */
  private attachWorldObjects(
    mapObjects: readonly MapObject[],
    factory: EntityFactory,
    owners: ReadonlyMap<string, string>,
  ): void {
    this.state.worldObjects = new WorldObjectStore({
      objects: mapObjects,
      factory,
      entities: this.state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
      owners,
    });
    this.state.events.on('entity-removed', ({ entityId }) =>
      this.state.worldObjects?.removed(entityId),
    );
  }

  /** Logs every rejected command at INFO `core.commands`, with the tick and the reason. */
  private logRejectedCommands(logger: Logger): void {
    this.state.events.on('command-rejected', ({ command, reason }) => {
      logger.log(
        makeLogRecord('INFO', 'core.commands', `Rejected ${command.type}: ${reason}`, {
          tick: this.state.tick,
          event: { name: 'command-rejected', attributes: { commandType: command.type, reason } },
        }),
      );
    });
  }

  /**
   * The match's map objects: the authored ones, or in a Duel only those of the closed Cathedral
   * arena (DEC-348).
   */
  private static matchMapObjects(
    { mapObjects, map }: Pick<SimulationOptions, 'mapObjects' | 'map'>,
    arena: typeof DUEL_RULES.arena | undefined,
  ): readonly MapObject[] | undefined {
    if (mapObjects === undefined || arena === undefined) return mapObjects;
    const cathedralId = map?.features.find(({ kind }) => kind === 'cathedral')?.id;
    return duelMapObjects(mapObjects, arena, cathedralId);
  }
}
