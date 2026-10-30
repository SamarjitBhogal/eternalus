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
import { unitClassOf } from './content/ai/unitClasses';
import { FORMATIONS } from './content/mobs/formations/formations';
import { SPACE_CELL_SIZE } from './content/ai/hordeSteering';
import type { ContentCatalogue } from './content/ContentCatalogue';
import { loadDefaultContent } from './content/loadDefaultContent';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { compareById } from './utils/compareById';
import type { LevelCurveDefinition } from './content/progression/progression.types';
import { loadLevelCurves } from './content/progression/loadLevelCurves';
import { XP_SOURCES } from './content/progression/xpSources';
import { loadWeapons } from './content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { EntityFactory } from './entities/EntityFactory';
import type { DefinitionSource, WeaponSource } from './entities/EntityFactory.types';
import type { GameEventHandler, GameEventType, Unsubscribe } from './state/GameEvents.types';
import { GameState } from './state/GameState';
import type { Snapshot } from './state/Snapshot.types';
import { StateHasher } from './state/StateHasher';
import type { SimulationOptions } from './Simulation.types';
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
    weapons,
  }: SimulationOptions) {
    const space = map === undefined ? null : new SpaceIndex(map.width, map.height, SPACE_CELL_SIZE);
    this.state = new GameState(validateGameConfig(config), seed, map ?? null, space);
    const { tickRate } = this.state.config;
    const curves = levelCurves ?? loadLevelCurves();
    const weaponSource = weapons ?? loadWeapons(tickRate);
    // One factory for commands and spawning, so entity ids come from one counter.
    const controllers = createDefaultControllerRegistry({
      aggro: AGGRO_RULES,
      formations: FORMATIONS,
      classOf: unitClassOf,
    });
    const units = content ?? Simulation.defaultContent(tickRate, curves, controllers, weaponSource);
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      Simulation.withStructures(units),
      undefined,
      weaponSource,
    );
    Simulation.spawnStructures(this.state, factory);
    this.commandContext = { state: this.state, factory };
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
    const features = [...(state.map?.features ?? [])].sort((a, b) => compareById(a.id, b.id));
    for (const { definitionId, position, team, laneId } of features) {
      if (STRUCTURE_DEFINITIONS.has(definitionId)) {
        const { kind } = STRUCTURE_DEFINITIONS.get(definitionId);
        const placement = { position, team, ...(laneId !== undefined && { laneId }) };
        state.entities.add(factory.create(kind, definitionId, placement));
      }
    }
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
