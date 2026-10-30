import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { FORMATIONS } from '../content/mobs/formations/formations';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { OPENING_WAVE, SPAWN_WAVES } from '../content/structures/spawnWaves';
import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { EntityFactory } from '../entities/EntityFactory';
import type { SpaceIndex } from '../physics/SpaceIndex';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { LaneFlowFields } from '../map/LaneFlowFields';
import { WorldMap } from '../map/WorldMap';
import type { GameState } from '../state/GameState';
import { CombatSystem } from './CombatSystem';
import { DeathSystem } from './DeathSystem';
import { HordeSystem } from './HordeSystem';
import { InvariantSystem } from './InvariantSystem';
import { MovementSystem } from './MovementSystem';
import { PathingSystem } from './PathingSystem';
import { ProgressionSystem } from './ProgressionSystem';
import type { ProgressionContent } from './ProgressionSystem.types';
import { SpaceSystem } from './SpaceSystem';
import { SpawnSystem } from './SpawnSystem';
import { StructureSystem } from './StructureSystem';
import { VeterancySystem } from './VeterancySystem';
import { MINION_VETERANCY } from '../content/mobs/minionVeterancy';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { GUARD_PLANS } from '../content/structures/guardPlans';
import { StatusEffectSystem } from './StatusEffectSystem';
import type { System } from './System.types';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order (architecture 10 §9, 11 §1, 18 §3.2): the AI, horde
 * progress, statuses, movement, the neighbour index, steering, combat, progression (kill XP),
 * minion veterancy, structure losses and breakability, spawning, death, then invariants last. This is the one place a system is added, at its position
 * in the tick (architecture 02 §9).
 * It builds the match's one `DamagePipeline` and one `StatusEffectApplier` (with the status
 * effects loaded for this match's config) and hands them to the systems that need them, so a damage
 * step applies to every hit and every status event comes from one place.
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /**
   * Creates the pipeline.
   *
   * @param invariants - The runner the last system checks with.
   * @param state - The match; its config sets the tick rate and lane structure count statuses load
   *   with, and systems that listen to its events subscribe here.
   * @param progression - The content kills are priced and levels applied with, injected.
   * @param hordes - The factory (and its definitions), neighbour index and AI the horde systems
   *   (architecture 11, 18) need; without them nothing decides, marches, steers or spawns on lanes.
   */
  public constructor(
    invariants: InvariantRunner,
    state: GameState,
    progression: ProgressionContent,
    hordes?: {
      readonly factory: EntityFactory;
      /** The index `state.space` exposes; `null` for a match without a map. */
      readonly space: SpaceIndex | null;
      /** Runs first: the AI, which `systems/` may not import, so `Simulation` composes it. */
      readonly decide: readonly System[];
    },
  ) {
    const { tickRate, map } = state.config;
    const damage = new DamagePipeline();
    const statuses = new StatusEffectApplier(
      loadStatusEffects(tickRate, map.spawnTowersPerLane + map.buffTowersPerLane),
    );
    const flowFields =
      hordes === undefined || state.map === null
        ? null
        : new LaneFlowFields(
            WorldMap.fromDefinition(
              state.map,
              map.navCellSize,
              (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
            ),
            state.map,
            map.flowFieldCorridorHalfWidth,
          );
    super([
      ...(hordes === undefined ? [] : [...hordes.decide, new HordeSystem(state, HORDE_STEERING)]),
      new StatusEffectSystem(damage, statuses),
      new MovementSystem(),
      ...(hordes === undefined
        ? []
        : [
            ...(hordes.space === null ? [] : [new SpaceSystem(hordes.space)]),
            new PathingSystem(
              createDefaultStrategyRegistry().movement,
              FORMATIONS,
              HORDE_STEERING.slotArrivalRadius,
              flowFields,
            ),
          ]),
      new CombatSystem(damage),
      // Every system that deals damage runs before this one, so a kill is awarded in its own tick.
      new ProgressionSystem(state, progression),
      new VeterancySystem(state, statuses, progression.units, MINION_VETERANCY),
      new StructureSystem(STRUCTURE_DEFINITIONS),
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
          ]),
      new DeathSystem(),
      new InvariantSystem(invariants),
    ]);
  }
}
