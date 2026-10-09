import { applyCommand } from './commands/applyCommand';
import type { Command } from './commands/Command.types';
import type { CommandContext, CommandHandlers } from './commands/CommandHandler.types';
import { CommandQueue } from './commands/CommandQueue';
import { createDefaultCommandHandlers } from './commands/defaultCommandHandlers';
import { validateGameConfig } from './config/validateGameConfig';
import { DefaultInvariantRunner } from './diagnostics/DefaultInvariantRunner';
import { RELEASE_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { makeLogRecord } from './diagnostics/makeLogRecord';
import { loadDefaultContent } from './content/loadDefaultContent';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { EntityFactory } from './entities/EntityFactory';
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
  }: SimulationOptions) {
    this.state = new GameState(validateGameConfig(config), seed);
    this.commandContext = {
      state: this.state,
      factory: new EntityFactory(
        createDefaultEntityRegistry(),
        content ?? loadDefaultContent(this.state.config.tickRate),
      ),
    };
    this.systemContext = { state: this.state, logger };
    this.pipeline =
      systems === undefined
        ? new DefaultSystemPipeline(new DefaultInvariantRunner(debug, logger))
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
}
