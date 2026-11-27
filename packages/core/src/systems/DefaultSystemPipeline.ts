import { DamagePipeline } from '../combat/DamagePipeline';
import { createDefaultDamageSteps } from '../combat/defaultDamageSteps';
import { KillCredit } from '../combat/KillCredit';
import { Footprint } from '../components/Footprint';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { LEGEND_RESPAWN_SECONDS } from '../content/progression/legendRespawn';
import { loadStuckDetection } from '../content/ai/loadStuckDetection';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { loadOutOfCombatHealing } from '../content/healing/loadOutOfCombatHealing';
import { loadLegendJump } from '../content/legends/loadLegendJump';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { FORMATIONS } from '../content/mobs/formations/formations';
import { ENRAGING_STRUCTURES } from '../content/mobs/minionModifiers';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { CATHEDRAL_GEM } from '../content/structures/cathedralGem';
import { loadSpawnWaves } from '../content/structures/loadSpawnWaves';
import { OPENING_WAVE } from '../content/structures/spawnWaves';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { StructureDefinition } from '../content/structures/structures.types';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { LaneFlowFields } from '../map/LaneFlowFields';
import type { GameState } from '../state/GameState';
import type { Rect } from '../utils/geometry.types';
import { CaptureSystem } from './CaptureSystem';
import { CathedralGemSystem } from './CathedralGemSystem';
import { CombatSystem } from './CombatSystem';
import { MapDestructionSystem } from './MapDestructionSystem';
import { DeathSystem } from './DeathSystem';
import type { DefaultSystemPipelineOptions } from './DefaultSystemPipeline.types';
import { DuelRoundSystem } from './DuelRoundSystem';
import { EnragedSystem } from './EnragedSystem';
import { HordeSystem } from './HordeSystem';
import { InvariantSystem } from './InvariantSystem';
import { JumpSystem } from './JumpSystem';
import { MatchDirectorSystem } from './MatchDirectorSystem';
import { MinionLevelSystem } from './MinionLevelSystem';
import { MovementSystem } from './MovementSystem';
import { OutOfCombatHealingSystem } from './OutOfCombatHealingSystem';
import { PathingSystem } from './PathingSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { RespawnSystem } from './RespawnSystem';
import { SpaceSystem } from './SpaceSystem';
import { SpawnSystem } from './SpawnSystem';
import { StructureSystem } from './StructureSystem';
import { StuckSystem } from './StuckSystem';
import { VeterancySystem } from './VeterancySystem';
import { ZoneLevelUpSystem } from './ZoneLevelUpSystem';
import { loadMinionVeterancy } from '../content/mobs/loadMinionVeterancy';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { CHECKPOINT_DEFENDER_LIMIT, CHECKPOINT_DEFENDERS } from '../content/structures/guardPlans';
import { ZONE_LOCKING_MOBS } from '../content/zones/zoneLocks';
import { TickRate } from '../utils/TickRate';
import { loadGuardPlans } from '../content/structures/loadGuardPlans';
import { loadZoneLevelUp } from '../content/zones/loadZoneLevelUp';
import { StatusEffectSystem } from './StatusEffectSystem';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order (architecture 10 §9, 11 §1, 18 §3.2): the AI, horde
 * progress, statuses, jumps (DEC-390: an airborne entity moves by its takeoff velocity), movement,
 * collision (DEC-121 (c): every later reader sees resolved
 * positions), the neighbour index, stuck detection (DEC-193), steering, combat, map destruction,
 * progression (kill XP), minion veterancy, structure losses and breakability, spawning (none in a
 * Duel, SCRUM-445), enraging, out-of-combat healing (DEC-188), respawn (queues the dead Legends,
 * FR-051), death, capture points, the Cathedral gem, the match director, then invariants last.
 * Combat runs after movement, so a unit with a target in reach faces it, not its own way
 * (DEC-192). This is the one place a system is added, at its position in the tick (architecture
 * 02 §9). It builds the match's one `DamagePipeline` and one `StatusEffectApplier` (with the
 * status effects loaded for this match's config) and hands them to the systems that need them, so
 * a damage step applies to every hit and every status event comes from one place.
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /** Creates the pipeline from its injected parts (`DefaultSystemPipelineOptions`). */
  public constructor({
    invariants,
    state,
    progression,
    director,
    duelStarts,
    spawnsMobs = true,
    hordes,
    structures = STRUCTURE_DEFINITIONS,
    assistWindowTicks,
  }: DefaultSystemPipelineOptions) {
    const { tickRate, map } = state.config;
    const veterancy = loadMinionVeterancy(tickRate);
    const loadedStatuses = loadStatusEffects(
      tickRate,
      map.spawnTowersPerLane + map.buffTowersPerLane,
    );
    const statuses = new StatusEffectApplier(loadedStatuses);
    const flowFields =
      hordes === undefined || state.world === null
        ? null
        : new LaneFlowFields(
            state.world.grid,
            state.world.definition,
            map.flowFieldCorridorHalfWidth,
          );
    // Minion strength reads lane progress from the lane fields (05 §9, `balancing.md`).
    // A death by the gem counts for the victim's last enemy damager in the assist window (DEC-346).
    const damage = new DamagePipeline(
      createDefaultDamageSteps(flowFields?.progress.bind(flowFields) ?? null),
      new KillCredit(assistWindowTicks, CATHEDRAL_GEM.statusIds),
    );
    const world = state.world?.grid ?? null;
    const features = state.world?.definition.features ?? [];
    if (world !== null && state.worldObjects !== undefined) {
      // A destroyed blocking map object reopens its cells and the lane fields over them (07 §10).
      state.events.on('entity-removed', ({ entityId }) => {
        const object = state.worldObjects?.objectFor(entityId);
        if (object?.isBlocking !== true) return;
        const cells = object.footprints.flatMap((footprint) =>
          world.clearFootprint(footprint, object.passages),
        );
        // `Simulation.buildWorld`'s rule: the grid also stamps the blocking feature behind an
        // object (a wall segment, turret or rock shares its feature's id), so clear that stamp too.
        const backing = features.find(
          ({ id, definitionId }) =>
            id === object.id && MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking === true,
        )?.footprint;
        if (backing !== undefined) cells.push(...world.clearFootprint(backing));
        flowFields?.markDirty(cells);
      });
    }
    super([
      ...(hordes === undefined ? [] : [...hordes.decide, new HordeSystem(state, HORDE_STEERING)]),
      new StatusEffectSystem(damage, statuses),
      new JumpSystem(loadLegendJump(tickRate)),
      new MovementSystem(),
      ...(hordes?.collisions ?? []),
      ...(hordes === undefined
        ? []
        : [
            ...(hordes.space === null ? [] : [new SpaceSystem(hordes.space)]),
            new StuckSystem(loadStuckDetection(tickRate)),
            new PathingSystem(
              createDefaultStrategyRegistry().movement,
              FORMATIONS,
              HORDE_STEERING.slotArrivalRadius,
              { flowFields, forts: DefaultSystemPipeline.fortBoxesOf(state, structures) },
            ),
          ]),
      new CombatSystem(damage),
      ...(state.worldObjects === undefined ? [] : [new MapDestructionSystem(state, damage)]),
      // Every system that deals damage runs before this one, so a kill is awarded in its own tick.
      new ProgressionSystem(state, progression),
      new VeterancySystem(state, statuses, veterancy),
      new StructureSystem(structures),
      ...(hordes === undefined
        ? []
        : [
            ...(spawnsMobs
              ? [
                  new SpawnSystem(state, hordes.factory, {
                    definitions: hordes.factory.definitions,
                    openingWave: OPENING_WAVE,
                    waves: loadSpawnWaves(tickRate),
                    steering: HORDE_STEERING,
                    weights: LANE_ASSESSMENT_WEIGHTS,
                    formationId: RANKS_FORMATION.id,
                    guards: loadGuardPlans(tickRate, hordes.guards),
                    defenders: CHECKPOINT_DEFENDERS,
                    defenderLimit: CHECKPOINT_DEFENDER_LIMIT,
                  }),
                ]
              : []),
            new EnragedSystem(state, statuses, ENRAGING_STRUCTURES),
          ]),
      // Before death, so a fallen Duel Legend is healed and moved instead of removed.
      ...(duelStarts === undefined ? [] : [new DuelRoundSystem(duelStarts)]),
      new OutOfCombatHealingSystem(state, loadOutOfCombatHealing(tickRate)),
      // After the Duel round, which heals a fallen Duel Legend, so it is never queued; queues the
      // Legends that died this tick before `DeathSystem` withdraws them.
      new RespawnSystem(
        new TickRate(tickRate).toTicks(LEGEND_RESPAWN_SECONDS),
        LANE_ASSESSMENT_WEIGHTS,
      ),
      new DeathSystem(),
      new CaptureSystem(state.config.match.capturePoints, tickRate, ZONE_LOCKING_MOBS),
      // Off in a Duel: the world around the arena is switched off there (DEC-36), and the gem's
      // Duel design waits on the owner's numbers (DEC-346, a follow-up PR).
      ...(duelStarts === undefined
        ? [new CathedralGemSystem(state, statuses, loadedStatuses, CATHEDRAL_GEM)]
        : []),
      ...(hordes === undefined ? [] : [new ZoneLevelUpSystem(state, loadZoneLevelUp(tickRate))]),
      // After every level source, so kill and zone levels land on the tick they are announced.
      new MinionLevelSystem(state, statuses, progression.units, veterancy),
      // After death, so an objective lost this tick can end the match this tick (12 §1).
      new MatchDirectorSystem(director),
      new InvariantSystem(invariants),
    ]);
  }

  /**
   * The box of the `Footprint` of every structure whose definition `hasFortBox`
   * (`PathingWorld.forts`; not a gate's, DEC-217 (17)). `Simulation` builds the structures before
   * the pipeline, so they are read here once, while every one still stands.
   */
  private static fortBoxesOf(
    state: GameState,
    structures: Pick<ContentCatalogue<StructureDefinition>, 'get'>,
  ): readonly Rect[] {
    const forts: Rect[] = [];
    state.entities.forEach((entity) => {
      const box = entity.findComponent(Footprint)?.bounds;
      if (box !== undefined && structures.get(entity.definitionId).hasFortBox === true) {
        forts.push(box);
      }
    });
    return forts;
  }
}
