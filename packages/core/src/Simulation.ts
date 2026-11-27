import { CastValidator } from './abilities/CastValidator';
import { checkAttackLinks } from './abilities/checkAttackLinks';
import { dashReach } from './abilities/dashReach';
import { createDefaultAbilityRegistry } from './abilities/defaultAbilityRegistry';
import { AiSystem } from './ai/AiSystem';
import type { TurretControllerContent } from './ai/TurretController.types';
import type { AiMemory } from './content/ai/ai.types';
import {
  createDefaultControllerRegistry,
  type ControllerRegistry,
} from './ai/defaultControllerRegistry';
import { applyCommand } from './commands/applyCommand';
import type { Command } from './commands/Command.types';
import type { CommandContext, CommandHandlers } from './commands/CommandHandler.types';
import { CommandQueue } from './commands/CommandQueue';
import { LegendSpawner } from './entities/LegendSpawner';
import { ROVER_BOT } from './content/ai/difficulties/rover';
import { createDefaultCommandHandlers } from './commands/defaultCommandHandlers';
import { Footprint } from './components/Footprint';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from './config/matchPhases';
import { validateGameConfig } from './config/validateGameConfig';
import { loadScoring } from './content/match/loadScoring';
import { DefaultInvariantRunner } from './diagnostics/DefaultInvariantRunner';
import { RELEASE_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import type { LogContext, Logger } from './diagnostics/Logger.types';
import { makeLogRecord } from './diagnostics/makeLogRecord';
import { recentContext } from './diagnostics/recentContext';
import { REPLAY_CHECKPOINT_EVERY } from './diagnostics/Replay.constants';
import { loadAggroRules } from './content/ai/aggro/loadAggroRules';
import { AI_CADENCE } from './content/ai/cadence';
import { LANE_ASSESSMENT_WEIGHTS } from './content/ai/laneAssessmentWeights';
import { ROVER_TACTICS } from './content/ai/rover';
import { loadAbilities } from './content/abilities/loadAbilities';
import { LEGEND_KIND_IDS } from './content/legends/legendKinds';
import { LEGEND_SPECS } from './content/legends/specs/legendSpecCatalogue';
import type { MapDefinition } from './content/maps/maps.types';
import type { MapObject } from './content/maps/mapObjects.types';
import type { GameConfig } from './config/GameConfig.types';
import { AStarPathfinder } from './map/AStarPathfinder';
import { RETREAT_STRUCTURES } from './content/ai/botLaner';
import { BOT_DIFFICULTIES } from './content/ai/difficulties/botDifficulties';
import { RANKS_FORMATION } from './content/mobs/formations/ranks';
import type { EntityId } from './state/EntityStore.types';
import { AreaHitQuery } from './state/AreaHitQuery';
import { LineOfFire } from './state/LineOfFire';
import { ReachQuery } from './state/ReachQuery';
import type { LineOfFireQuery } from './state/LineOfFire.types';
import { assignLanes } from './state/assignLanes';
import { formationSlot } from './state/formationSlot';
import type { SlotReadiness } from './state/SlotReadiness.types';
import { unitClassOf } from './content/ai/unitClasses';
import { SPACE_CELL_SIZE } from './content/ai/hordeSteering';
import { ContentCatalogue } from './content/ContentCatalogue';
import { UnknownDefinitionError } from './content/UnknownDefinitionError';
import { loadDefaultContent } from './content/loadDefaultContent';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import type { LevelCurveDefinition } from './content/progression/progression.types';
import { loadLevelCurves } from './content/progression/loadLevelCurves';
import { ULTIMATE_CHARGE } from './content/progression/ultimateCharge';
import { XP_SOURCES } from './content/progression/xpSources';
import { loadWeapons } from './content/weapons/loadWeapons';
import { ZONE_DEFINITIONS, ZONE_PLACEMENTS } from './content/zones/zoneCatalogue';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { EntityFactory } from './entities/EntityFactory';
import { DUEL_RULES } from './content/duel/duelRules';
import { duelMapObjects } from './match/duelArena';
import { duelStartPoints } from './match/duelStartPoints';
import { createDefaultMatchDirector } from './match/defaultMatchDirector';
import { MatchTimeline } from './match/MatchTimeline';
import { timelineFrameOf } from './config/timelineFrameOf';
import type { DefinitionSource, WeaponSource } from './entities/EntityFactory.types';
import { Unit } from './entities/Unit';
import type {
  GameEventHandler,
  GameEventMap,
  GameEventType,
  Unsubscribe,
} from './state/GameEvents.types';
import { GameState } from './state/GameState';
import { MatchWorld } from './state/MatchWorld';
import type { Snapshot } from './state/Snapshot.types';
import { StateHasher } from './state/StateHasher';
import type {
  Replay,
  ReplaySetup,
  RosterSlot,
  SimulationOptions,
  StructureSource,
} from './Simulation.types';
import { SpaceIndex } from './physics/SpaceIndex';
import { CollisionResolver } from './physics/CollisionResolver';
import type { StaticCollisionIndex } from './physics/StaticCollisionIndex';
import { MatchPathfinderFactory } from './map/MatchPathfinderFactory';
import { staticCollisionIndexOf } from './map/staticCollisionIndexOf';
import { structureBodiesOf } from './map/structureBodiesOf';
import { zoneAreaOf } from './map/zoneArea';
import { loadProjectiles } from './content/projectiles/loadProjectiles';
import { loadTurrets } from './content/structures/loadTurrets';
import { DefaultSystemPipeline } from './systems/DefaultSystemPipeline';
import type { SystemContext } from './systems/System.types';
import { SystemPipeline } from './systems/SystemPipeline';
import { WorldObjectStore } from './state/WorldObjectStore';
import type { WorldObjectStoreOptions } from './state/WorldObjectStore.types';
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
  private readonly handlers: CommandHandlers;
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
  /** The match's one cast rule (`CastValidator`), as the snapshot reads it. */
  private readonly readiness: SlotReadiness;

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
    mapObjects: authoredObjects,
    levelCurves,
    roster = [],
    weapons,
    abilities,
    guardPlans,
    duel,
    structures = STRUCTURE_DEFINITIONS,
  }: SimulationOptions) {
    const validConfig = validateGameConfig(config);
    const timeline = MatchTimeline.resolve(validConfig);
    this.setup = {
      seed,
      config: validConfig,
      ...(map === undefined ? {} : { map }),
      ...(authoredObjects === undefined ? {} : { mapObjects: authoredObjects }),
      ...(roster.length === 0 ? {} : { roster }),
      ...(duel === undefined ? {} : { duel }),
    };
    // A Duel keeps only the arena (DEC-36, DEC-348; SCRUM-445, SCRUM-446, SCRUM-450).
    const arena = duel === undefined ? undefined : DUEL_RULES.arena;
    const mapObjects =
      authoredObjects === undefined || arena === undefined
        ? authoredObjects
        : duelMapObjects(
            authoredObjects,
            arena,
            map?.features.find(({ kind }) => kind === 'cathedral')?.id,
          );
    const { space, world, paths, walls, collisions } = Simulation.buildWorld(
      map,
      validConfig,
      mapObjects,
    );
    // Without the default pipeline no director runs, so no mark would ever fire: list none.
    const schedule = systems === undefined ? timeline.schedule() : [];
    this.state = new GameState(
      validConfig,
      seed,
      world,
      { space, paths, collisions },
      { schedule, countdownEndTick: timelineFrameOf(validConfig).countdownEndTick },
    );
    const duelStarts =
      duel === undefined ? undefined : duelStartPoints(map, DUEL_RULES.startOffset);
    if (duel !== undefined) this.state.match.startDuel(duel.killTarget);
    const { tickRate } = this.state.config;
    const curves = levelCurves ?? loadLevelCurves();
    this.curves = curves;
    const weaponSource = weapons ?? loadWeapons(tickRate);
    const registry = abilities ?? createDefaultAbilityRegistry(loadAbilities(tickRate), tickRate);
    // The turret content, with the ammo lists of the structures this match builds (DEC-168 B8).
    const turrets = loadTurrets(tickRate, { structures: structures.all() });
    const projectiles = loadProjectiles(tickRate);
    checkAttackLinks(registry, weaponSource.all(), turrets.ammo.all(), projectiles.all());
    // One cast rule per match: the handler, `AbilitySystem`, the snapshot and the bots share it.
    const validator = new CastValidator(registry);
    this.handlers = createDefaultCommandHandlers({
      rover: { controllerId: 'rover', profileId: ROVER_BOT.id, memory: {} },
      cast: validator,
    });
    this.readiness = validator;
    // The match's one aim rule and one hit rule for areas, shared by the bots, the turrets, the
    // line of fire and the systems (DEC-344 (3)).
    const reach = new ReachQuery();
    const areas = new AreaHitQuery();
    // The line-of-fire query of the bots and turrets: each drops a target its shot cannot reach
    // (DEC-317 addendum).
    const lineOfFire = new LineOfFire(projectiles, reach, areas);
    const controllers = Simulation.createControllers(validator, tickRate, lineOfFire, reach, {
      profiles: turrets.profiles,
      projectiles,
      lineOfFire,
    });
    const units = content ?? Simulation.defaultContent(tickRate, curves, controllers, weaponSource);
    // One factory for commands and spawning, so entity ids come from one counter.
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      Simulation.firstOf([
        new ContentCatalogue(Object.values(MAP_OBJECT_DEFINITIONS)),
        ZONE_DEFINITIONS,
        projectiles,
        units,
        structures,
      ]),
      undefined,
      weaponSource,
      LEGEND_SPECS,
      turrets.ammo,
    );
    const bodies = Simulation.spawnStructures(this.state, factory, {
      structures,
      mapObjects,
      omittedIds: arena?.omittedStructureIds ?? [],
    });
    this.state.indexStructures();
    // Before the pipeline: zones can be guard homes, which SpawnSystem finds when it is built.
    const zones =
      arena?.hasCaptureObjectives === false ? [] : Simulation.spawnZones(this.state, factory);
    this.commandContext = { state: this.state, factory };
    if (mapObjects !== undefined && map === undefined)
      throw new Error('Map objects require a generated map');
    if (mapObjects !== undefined) {
      // A skipped removal here leaves a broken wall in the collision index (critic r2 F1).
      if (walls === null) throw new Error('Map objects require a collision index');
      const worldObjects = new WorldObjectStore({
        objects: mapObjects,
        factory: this.commandContext.factory,
        entities: this.state.entities,
        definitions: MAP_OBJECT_DEFINITIONS,
        ...bodies,
      });
      this.state.worldObjects = worldObjects;
      this.state.events.on('entity-removed', ({ entityId }) => {
        worldObjects.removed(entityId);
        // At once, so walking and a dash both stop seeing it from now on (critic r2 F1). A retired
        // structure is not a map object (`objectFor` gives nothing), so its body (a tower's fort,
        // a turret's pylon) stays as a ruin that blocks (DEC-341, HC-Q91). A pylon that falls
        // itself is its own entity, so it goes (DEC-388).
        const object = worldObjects.objectFor(entityId);
        if (object !== undefined) walls.remove(object.id);
      });
    }
    this.systemContext = { state: this.state, logger };
    if (systems === undefined) {
      // Before any Legend spawns (`spawnRoster`), so `Scoring` hears each one's `entity-spawned`
      // and gives it a row.
      const scoring = loadScoring(tickRate);
      const director = createDefaultMatchDirector({
        state: this.state,
        timeline,
        debug,
        logger,
        scoring,
      });
      this.pipeline = new DefaultSystemPipeline({
        invariants: new DefaultInvariantRunner({
          debug,
          logger,
          abilities: registry.definitions,
          curves,
          phaseOrder: MATCH_PHASES,
          terminalPhases: TERMINAL_MATCH_PHASES,
        }),
        state: this.state,
        factory,
        progression: {
          units,
          curves,
          xpSources: XP_SOURCES,
          ultimateCharge: ULTIMATE_CHARGE,
          ...(duel === undefined ? {} : { duel: DUEL_RULES.progression }),
        },
        director,
        abilities: registry,
        validator,
        // One scoring load: a gem kill's window is the assists' window (DEC-346).
        assistWindowTicks: scoring.assistWindowTicks,
        areas,
        reach,
        ...(duelStarts === undefined ? {} : { duelStarts }),
        ...(arena === undefined ? {} : { spawnsMobs: arena.spawnsMobs }),
        hordes: {
          space,
          ...(guardPlans === undefined ? {} : { guards: guardPlans }),
          collisions: collisions === null ? [] : [new CollisionSystem(collisions)],
          decide: [
            new AiSystem(this.state, controllers, AI_CADENCE, (command) => {
              this.botQueue.enqueue(command);
            }),
          ],
        },
        structures,
      });
      director.start(this.state);
    } else {
      this.pipeline = new SystemPipeline(systems);
    }
    Simulation.spawnRoster(this.state, factory, roster, controllers, logger, duelStarts);
    // Announced only now, so the director and the systems hear every spawn (plan §4.4).
    for (const zone of zones) {
      this.state.events.emit('entity-spawned', zone);
    }
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

  /**
   * How far a dash of a caster of `radius` from `from` along `direction` (a unit vector) may go
   * before a wall or the map's edge stops it, up to `distance` metres: `DashEffect`'s own rule on
   * the match's own walls. A read-only query for aim previews; it changes nothing.
   */
  public dashReach(from: Vec2, direction: Vec2, distance: number, radius: number): number {
    return dashReach(this.state.collisions, from, direction, distance, radius);
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
    return this.state.snapshot(this.curves, this.readiness);
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
   * One definition source over `sources`, so one factory builds map objects, zones, shots, units
   * and structures (architecture 04 §6): the first source that has an id answers for it.
   */
  private static firstOf(sources: readonly DefinitionSource[]): DefinitionSource {
    const sourceOf = (id: string): DefinitionSource | undefined =>
      sources.find((source) => source.has(id));
    return {
      has: (id) => sourceOf(id) !== undefined,
      get: (id) => {
        const source = sourceOf(id);
        if (source === undefined) {
          throw new UnknownDefinitionError(id);
        }
        return source.get(id);
      },
    };
  }

  /**
   * Builds the map's structures, in feature id order, before anything else spawns (architecture
   * 07 §1): every feature whose definition is a structure becomes that structure, with its team
   * and lane. Features without a structure definition (walls, corner camps) stay map data.
   * A structure's `Footprint` (`Footprint.ofBody`) holds the footprints of its feature's map object
   * of the same id when its definition `hasMapFootprint` (a lane tower's fort, DEC-185; a gate's own
   * outline, DEC-217 (17); a wall turret's pylon), and the footprints of the blocking objects that
   * are `partOf` it as solid polygons (the Stronghold's outer walls and throne, DEC-386 (1), so
   * melee at an outer wall reaches it, DEC-185 D; `structureBodiesOf`). The palace floor is not
   * part of the Stronghold (DEC-344 (4)). Each blocking such object (a fort, an outer wall, the
   * throne) is the structure's body: it has no health of its own (one pool, DEC-185 B). Towers and
   * the Stronghold share one pool with their body. The gates' objects of the same id do not block,
   * so they keep their own health, and their outline is walked on (`Footprint.walkOn`): a shot
   * flies over it unless it was fired at the gate. An object that a structure is mounted on (a
   * wall turret's pylon, `isMounted`, DEC-388) keeps its own health too, and its fall takes the
   * structure with it. A body outlives its structure as a ruin that blocks
   * (`WorldObjectStore.removed`, DEC-341). A Duel does not build the structures its
   * `omittedStructureIds` list (DEC-348: towers, gates, camps and Strongholds; the Cathedral's gem
   * stays).
   *
   * @returns Map object id → the id of the structure it is the body of (`owners`) or is mounted on
   *   (`mounted`).
   */
  private static spawnStructures(
    state: GameState,
    factory: EntityFactory,
    {
      structures,
      mapObjects = [],
      omittedIds,
    }: {
      readonly structures: StructureSource;
      readonly mapObjects?: readonly MapObject[] | undefined;
      readonly omittedIds: readonly string[];
    },
  ): Required<Pick<WorldObjectStoreOptions, 'owners' | 'mounted'>> {
    const features = (state.world?.definition.features ?? []).filter(
      ({ definitionId }) => !omittedIds.includes(definitionId),
    );
    const owners = new Map<string, string>();
    const mounted = new Map<string, string>();
    for (const { feature, own, parts, bodyIds, mountId } of structureBodiesOf(
      features,
      mapObjects,
      structures,
    )) {
      const { id, definitionId, position, team, laneId } = feature;
      const placement = {
        position,
        team,
        mapFeatureId: id,
        ...(laneId !== undefined && { laneId }),
      };
      const structure = factory.create(structures.get(definitionId).kind, definitionId, placement);
      const footprint = Footprint.ofBody(own, parts);
      if (footprint !== undefined) structure.addComponent(footprint);
      for (const bodyId of bodyIds) owners.set(bodyId, structure.id);
      if (mountId !== undefined) mounted.set(mountId, structure.id);
      state.entities.add(structure);
    }
    return { owners, mounted };
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
   * to its team's seat in `state.match` (`humanLegendId` for `playerTeam`). Runs once the match director exists, so its listeners hear
   * every `entity-spawned` (plan §4.4). The roster is setup, so nothing is queued or recorded: a
   * replay rebuilds it. A human slot whose definition does not exist or is not a Legend logs ERROR
   * `core.match` and does not spawn, and the match runs on without a human: the class comes from
   * saved data and can be stale (ADR 0023).
   *
   * @throws Error when there is a roster but no map, more than one human slot on a team, a lone
   *   human slot off `playerTeam`, a team's slots do not fit under `legendsPerTeam` or the Unit cap, its laners do
   *   not fit under `legendsPerLane`, or a bot's controller or difficulty does not exist or its
   *   definition is not a Legend (checked before anything spawns).
   */
  private static spawnRoster(
    state: GameState,
    factory: EntityFactory,
    roster: readonly RosterSlot[],
    controllers: ControllerRegistry,
    logger: Logger,
    duelStarts?: Readonly<Record<PlayableTeam, Vec2>>,
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
    const legends = new LegendSpawner(factory);
    const humans = Simulation.humanSlotsOf(roster, state.config.match.playerTeam);
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
      const reason = slot.pilot === 'bot' ? legends.refusal(slot.definitionId) : null;
      if (reason !== null) {
        throw new Error(
          `Roster slot ${String(index)} (a ${slot.team} bot) cannot spawn "${slot.definitionId}": ${reason}.`,
        );
      }
    });
    const refusals = new Map(humans.map((human) => [human, legends.refusal(human.definitionId)]));
    // A refused human slot still counts against the caps below, but takes no lane and no spawn.
    const spawning = roster.filter((slot) => (refusals.get(slot) ?? null) === null);
    const plans = Simulation.planLanes(
      state,
      roster,
      spawning,
      routes.lanes.map(({ id }) => id),
    );
    for (const [human, refusal] of refusals) {
      if (refusal !== null) {
        logger.log(
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
        Simulation.spawnSlot(state, legends, slot, { x: at.x, y: at.y }, { lane });
      });
    }
    for (const slot of spawning.filter(({ role }) => role === 'rover')) {
      const forWhom = slot.pilot === 'human' ? "the human's Legend" : `the ${slot.team} Rover`;
      const position =
        duelStarts?.[slot.team] ?? Simulation.strongholdOf(state, slot.team, forWhom);
      Simulation.spawnSlot(state, legends, slot, position, {});
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

  /**
   * Spawns one zone per map feature that places one (`ZONE_PLACEMENTS`): a capture point where
   * each lane crosses the centre line, the middle one in the Cathedral (architecture 07 §7), each
   * covering its building's floor (DEC-145 (a)). They come from the map alone, so a replay (seed,
   * config and commands) rebuilds them. They spawn right after the structures, before the system
   * pipeline is built, since a zone can be a guard home (18 §7); the caller announces them once the
   * pipeline listens.
   *
   * @returns Each zone's `entity-spawned` payload, in spawn order.
   */
  private static spawnZones(
    state: GameState,
    factory: EntityFactory,
  ): GameEventMap['entity-spawned'][] {
    const spawned: GameEventMap['entity-spawned'][] = [];
    const map = state.world?.definition;
    if (map === undefined) {
      return spawned;
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
        ...(feature.laneId !== undefined && { laneId: feature.laneId }),
      });
      state.entities.add(entity);
      spawned.push({ entityId: entity.id, kind, team: feature.team });
    }
    return spawned;
  }

  /** The controller a bot of `slot`'s role plays with: a Rover's or a lane bot's. */
  private static controllerOf(slot: RosterSlot): 'rover' | 'bot-legend' {
    return slot.role === 'rover' ? 'rover' : 'bot-legend';
  }

  /**
   * Spawns one roster slot's Legend at `position` on its team, facing the enemy Stronghold
   * (DEC-216 (6)), and announces it: a bot with its controller (whose brain starts with `memory`),
   * the human with none, recorded as the human's Legend (DEC-172).
   */
  private static spawnSlot(
    state: GameState,
    legends: LegendSpawner,
    slot: RosterSlot,
    position: Vec2,
    memory: AiMemory,
  ): void {
    const entity = legends.spawn(state, slot.definitionId, slot.team, position, {
      ...(slot.specId !== undefined && { specId: slot.specId }),
      ...(slot.pilot === 'bot' && {
        controller: {
          controllerId: Simulation.controllerOf(slot),
          profileId: slot.difficulty,
          memory,
        },
      }),
    });
    if (slot.pilot === 'human') {
      state.match.seatHuman(entity.id, slot.team);
    }
  }

  /**
   * Where `team`'s Stronghold stands on the map: where its Rovers (the human's Legend among them)
   * start.
   *
   * @throws Error naming `forWhom` when the map has no Stronghold for `team`.
   */
  private static strongholdOf(state: GameState, team: PlayableTeam, forWhom: string): Vec2 {
    const stronghold = state.world?.strongholdOf(team);
    if (stronghold === undefined) {
      throw new Error(`The map has no ${team} Stronghold for ${forWhom}.`);
    }
    return stronghold;
  }

  /**
   * The map's spatial pieces: the match world (its one walkability grid shared by the lane flow
   * fields and A\* for Legends), the neighbour index and A\*. All `null` without a map. With
   * `mapObjects`, the grid also blocks what the collision system blocks (06 §6): every blocking
   * object's footprints, minus its passages. A feature whose object is walkable (a Stronghold's
   * floor, whose walls and furniture are objects of their own) is not stamped; other blocking
   * features keep their stamp, which also fills a tower's hollow core so no path ends in a pocket
   * the walls close off. Also with `mapObjects`, `walls` is the one static collision index, from
   * which a destroyed object is removed, and `collisions` the one `CollisionResolver` on it and the
   * map's bounds: `CollisionSystem` moves units with it and the state's `collisions` port cuts
   * dashes with it.
   */
  private static buildWorld(
    map: MapDefinition | undefined,
    config: GameConfig,
    mapObjects: readonly MapObject[] | undefined,
  ): {
    readonly space: SpaceIndex | null;
    readonly world: MatchWorld | null;
    readonly paths: AStarPathfinder | null;
    readonly walls: StaticCollisionIndex | null;
    readonly collisions: CollisionResolver | null;
  } {
    if (map === undefined) {
      return { space: null, world: null, paths: null, walls: null, collisions: null };
    }
    const { grid, paths } = new MatchPathfinderFactory().create(map, config, mapObjects);
    const walls = mapObjects === undefined ? null : staticCollisionIndexOf(map, mapObjects);
    return {
      space: new SpaceIndex(map.width, map.height, SPACE_CELL_SIZE),
      world: new MatchWorld(map, grid),
      paths,
      walls,
      collisions:
        walls === null
          ? null
          : new CollisionResolver(walls, { x: 0, y: 0, width: map.width, height: map.height }),
    };
  }

  /**
   * Every controller, with the shipped content it reads (architecture 11 §2); the aggro profiles
   * are loaded at `tickRate`. Bots check their line of fire with `lineOfFire` and their reach
   * with `reach`; turrets read `turret` (the match's loaded turret profiles and projectiles, and
   * the same `lineOfFire`).
   */
  private static createControllers(
    readiness: SlotReadiness,
    tickRate: number,
    lineOfFire: LineOfFireQuery,
    reach: ReachQuery,
    turret: TurretControllerContent,
  ): ControllerRegistry {
    const bots = {
      difficulties: BOT_DIFFICULTIES,
      retreatTo: RETREAT_STRUCTURES,
      readiness,
      lineOfFire,
      reach,
    };
    return createDefaultControllerRegistry({
      leash: { aggro: loadAggroRules(tickRate), classOf: unitClassOf },
      botLegend: bots,
      rover: {
        ...bots,
        tactics: ROVER_TACTICS,
        legendKinds: LEGEND_KIND_IDS,
        laneWeights: LANE_ASSESSMENT_WEIGHTS,
      },
      turret,
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
