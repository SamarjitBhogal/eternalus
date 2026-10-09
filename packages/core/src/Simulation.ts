import { applyCommand } from './commands/applyCommand';
import type { Command } from './commands/Command.types';
import type { CommandContext, CommandHandlers } from './commands/CommandHandler.types';
import { CommandQueue } from './commands/CommandQueue';
import { createDefaultCommandHandlers } from './commands/defaultCommandHandlers';
import type { GameConfig } from './config/GameConfig.types';
import { validateGameConfig } from './config/validateGameConfig';
import type { Logger } from './diagnostics/Logger.types';
import { makeLogRecord } from './diagnostics/makeLogRecord';
import { loadDefaultContent } from './content/loadDefaultContent';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { EntityFactory } from './entities/EntityFactory';
import type { GameEventHandler, GameEventType, Unsubscribe } from './state/GameEvents.types';
import { GameState } from './state/GameState';
import type { Snapshot } from './state/Snapshot.types';
import { StateHasher } from './state/StateHasher';
import type { System, SystemContext } from './systems/System.types';
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
   * @param config - The match config; validated here, so an invalid one throws
   *   `ConfigValidationError` before anything runs.
   * @param seed - The match seed, a whole number from 0 to 2^32 - 1.
   * @param logger - Where core's log records go.
   * @param systems - The tick's systems in execution order.
   */
  public constructor(
    config: GameConfig,
    seed: number,
    logger: Logger,
    systems: readonly System[] = [],
  ) {
    this.state = new GameState(validateGameConfig(config), seed);
    this.commandContext = {
      state: this.state,
      factory: new EntityFactory(
        createDefaultEntityRegistry(),
        loadDefaultContent(this.state.config.tickRate),
      ),
    };
    this.systemContext = { state: this.state, logger };
    this.pipeline = new SystemPipeline(systems);
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
   * Advances exactly one tick: applies the queued commands in order, runs the systems in order,
   * counts the tick and emits `tick-completed`.
   */
  public step(): void {
    for (const command of this.queue.drain()) {
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
