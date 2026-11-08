import { DamagePipeline } from '../combat/DamagePipeline';
import { Footprint } from '../components/Footprint';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { STUCK_DETECTION } from '../content/ai/stuckDetection';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { OUT_OF_COMBAT_HEALING } from '../content/healing/outOfCombatHealing';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { FORMATIONS } from '../content/mobs/formations/formations';
import { ENRAGING_STRUCTURES } from '../content/mobs/minionModifiers';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { OPENING_WAVE, SPAWN_WAVES } from '../content/structures/spawnWaves';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { LaneFlowFields } from '../map/LaneFlowFields';
import type { GameState } from '../state/GameState';
import type { Rect } from '../utils/geometry.types';
import { CaptureSystem } from './CaptureSystem';
import { CombatSystem } from './CombatSystem';
import { MapDestructionSystem } from './MapDestructionSystem';
import { DeathSystem } from './DeathSystem';
import type { DefaultSystemPipelineOptions } from './DefaultSystemPipeline.types';
import { EnragedSystem } from './EnragedSystem';
import { HordeSystem } from './HordeSystem';
import { InvariantSystem } from './InvariantSystem';
import { MatchDirectorSystem } from './MatchDirectorSystem';
import { MovementSystem } from './MovementSystem';
import { OutOfCombatHealingSystem } from './OutOfCombatHealingSystem';
import { PathingSystem } from './PathingSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { SpaceSystem } from './SpaceSystem';
import { SpawnSystem } from './SpawnSystem';
import { StructureSystem } from './StructureSystem';
import { StuckSystem } from './StuckSystem';
import { VeterancySystem } from './VeterancySystem';
import { MINION_VETERANCY } from '../content/mobs/minionVeterancy';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { GUARD_PLANS } from '../content/structures/guardPlans';
import { StatusEffectSystem } from './StatusEffectSystem';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order (architecture 10 §9, 11 §1, 18 §3.2): the AI, horde
 * progress, statuses, movement, collision (DEC-121 (c): every later reader sees resolved
 * positions), the neighbour index, stuck detection (DEC-193), steering, combat, map destruction,
 * progression (kill XP), minion veterancy, structure losses and breakability, spawning, enraging,
 * out-of-combat healing (DEC-188), death, capture points, the match director, then invariants
 * last. This is the one place a system is added, at its position in the tick (architecture 02 §9).
 * It builds the match's one `DamagePipeline` and one `StatusEffectApplier` (with the status effects
 * loaded for this match's config) and hands them to the systems that need them, so a damage step
 * applies to every hit and every status event comes from one place.
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /** Creates the pipeline from its injected parts (`DefaultSystemPipelineOptions`). */
  public constructor({
    invariants,
    state,
    progression,
    director,
    hordes,
    structures = STRUCTURE_DEFINITIONS,
  }: DefaultSystemPipelineOptions) {
    const { tickRate, map } = state.config;
    const damage = new DamagePipeline();
    const statuses = new StatusEffectApplier(
      loadStatusEffects(tickRate, map.spawnTowersPerLane + map.buffTowersPerLane),
    );
    const flowFields =
      hordes === undefined || state.world === null
        ? null
        : new LaneFlowFields(
            state.world.grid,
            state.world.definition,
            map.flowFieldCorridorHalfWidth,
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
      new MovementSystem(),
      ...(hordes?.collisions ?? []),
      ...(hordes === undefined
        ? []
        : [
            ...(hordes.space === null ? [] : [new SpaceSystem(hordes.space)]),
            new StuckSystem(STUCK_DETECTION),
            new PathingSystem(
              createDefaultStrategyRegistry().movement,
              FORMATIONS,
              HORDE_STEERING.slotArrivalRadius,
              { flowFields, forts: DefaultSystemPipeline.fortBoxesOf(state) },
            ),
          ]),
      new CombatSystem(damage),
      ...(state.worldObjects === undefined ? [] : [new MapDestructionSystem(state, damage)]),
      // Every system that deals damage runs before this one, so a kill is awarded in its own tick.
      new ProgressionSystem(state, progression),
      new VeterancySystem(state, statuses, progression.units, MINION_VETERANCY),
      new StructureSystem(structures),
      ...(hordes === undefined
        ? []
        : [
            new SpawnSystem(state, hordes.factory, {
              definitions: hordes.factory.definitions,
              openingWave: OPENING_WAVE,
              waves: SPAWN_WAVES,
              steering: HORDE_STEERING,
              weights: LANE_ASSESSMENT_WEIGHTS,
              formationId: RANKS_FORMATION.id,
              guards: GUARD_PLANS,
            }),
            new EnragedSystem(state, statuses, ENRAGING_STRUCTURES),
          ]),
      new OutOfCombatHealingSystem(state, OUT_OF_COMBAT_HEALING),
      new DeathSystem(),
      new CaptureSystem(state.config.match.capturePoints, tickRate),
      // After death, so an objective lost this tick can end the match this tick (12 §1).
      new MatchDirectorSystem(director),
      new InvariantSystem(invariants),
    ]);
  }

  /**
   * The box of every structure's `Footprint` (`PathingWorld.forts`). `Simulation` builds the
   * structures before the pipeline, so they are read here once, while every one still stands.
   */
  private static fortBoxesOf(state: GameState): readonly Rect[] {
    const forts: Rect[] = [];
    state.entities.forEach((entity) => {
      const box = entity.findComponent(Footprint)?.bounds;
      if (box !== undefined) forts.push(box);
    });
    return forts;
  }
}
