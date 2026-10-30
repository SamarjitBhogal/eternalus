import { AiSystem } from './ai/AiSystem';
import { FollowLeaderController } from './ai/FollowLeaderController';
import { applyCommand } from './commands/applyCommand';
import type { Command } from './commands/Command.types';
import type { CommandContext, CommandHandlers } from './commands/CommandHandler.types';
import { CommandQueue } from './commands/CommandQueue';
import { createDefaultCommandHandlers } from './commands/defaultCommandHandlers';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from './config/matchPhases';
import { validateGameConfig } from './config/validateGameConfig';
import { FOLLOW_LEADER_PROFILE } from './content/ai/followLeaderProfile';
import { DefaultInvariantRunner } from './diagnostics/DefaultInvariantRunner';
import { RELEASE_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import type { Logger } from './diagnostics/Logger.types';
import { makeLogRecord } from './diagnostics/makeLogRecord';
import { loadDefaultContent } from './content/loadDefaultContent';
import { loadLevelCurves } from './content/progression/loadLevelCurves';
import { XP_SOURCES } from './content/progression/xpSources';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { EntityFactory } from './entities/EntityFactory';
import { createDefaultMatchDirector } from './match/defaultMatchDirector';
import { MatchTimeline } from './match/MatchTimeline';
import type { EntityId } from './state/EntityStore.types';
import type { GameEventHandler, GameEventType, Unsubscribe } from './state/GameEvents.types';
import { GameState } from './state/GameState';
import type { Snapshot } from './state/Snapshot.types';
import { StateHasher } from './state/StateHasher';
import type { SimulationOptions } from './Simulation.types';
import { DefaultSystemPipeline } from './systems/DefaultSystemPipeline';
import type { SystemContext } from './systems/System.types';
import { SystemPipeline } from './systems/SystemPipeline';

/**
 * The deterministic simulation of one match, and the only thing the client drives
 * (architecture 03 §6). Same config, seed and commands give the same match, tick for tick.
 * Composition root of core: it builds the state, the command registry and the system pipeline,
 * and, with the default pipeline, the match director (started here, so the countdown covers tick 0).
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
    levelCurves,
  }: SimulationOptions) {
    const validConfig = validateGameConfig(config);
    const timeline = MatchTimeline.resolve(validConfig);
    // Without the default pipeline no director runs, so no mark would ever fire: list none.
    this.state = new GameState(validConfig, seed, systems === undefined ? timeline.schedule() : []);
    const curves = levelCurves ?? loadLevelCurves();
    const units = content ?? loadDefaultContent(this.state.config.tickRate, curves);
    this.commandContext = {
      state: this.state,
      factory: new EntityFactory(createDefaultEntityRegistry(), units),
    };
    this.systemContext = { state: this.state, logger };
    // PROTOTYPE(PROTO-01) TEMPORARY: replace this hand-built controller list with
    // `ai/defaultControllerRegistry.ts` (11 §2) and `FollowLeaderController` with `MinionController`.
    if (systems === undefined) {
      const director = createDefaultMatchDirector({ state: this.state, timeline, debug, logger });
      this.pipeline = new DefaultSystemPipeline({
        invariants: new DefaultInvariantRunner(
          debug,
          logger,
          curves,
          MATCH_PHASES,
          TERMINAL_MATCH_PHASES,
        ),
        state: this.state,
        progression: { units, curves, xpSources: XP_SOURCES },
        director,
        decide: [
          new AiSystem([new FollowLeaderController(FOLLOW_LEADER_PROFILE)], (command) => {
            this.queue.enqueue(command);
          }),
        ],
      });
      director.start(this.state);
    } else {
      this.pipeline = new SystemPipeline(systems);
    }
    this.seatHuman(logger);
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
   * Spawns the human's Legend from `config.match.seat` through the `dev-spawn` handler (the one
   * spawn path) and records its id in `state.match.humanLegendId`. The seat is config, so nothing is
   * queued or recorded: a replay rebuilds it. A failed spawn logs ERROR `core.match` and leaves the
   * id `null`; the match runs on without a human.
   */
  private seatHuman(logger: Logger): void {
    const { seat, playerTeam } = this.state.config.match;
    if (seat === null) {
      return;
    }
    // ponytail: the dev-spawn handler is the only single-unit spawn path today; move the seat to
    // SpawnSystem's single-unit path once the sovereign work (GL-3) adds it.
    let spawned: EntityId | null = null;
    const stop = this.state.events.on('entity-spawned', ({ entityId }) => {
      spawned = entityId;
    });
    const reason = this.handlers['dev-spawn'].handle(
      {
        type: 'dev-spawn',
        kind: seat.definitionId,
        definitionId: seat.definitionId,
        team: playerTeam,
        at: seat.at,
        count: 1,
      },
      this.commandContext,
    );
    stop();
    if (reason === null) {
      this.state.match.humanLegendId = spawned;
      return;
    }
    logger.log(
      makeLogRecord(
        'ERROR',
        'core.match',
        `The human's Legend "${seat.definitionId}" did not spawn: ${reason}.`,
        { attributes: { definitionId: seat.definitionId, reason } },
      ),
    );
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
}
