import { DamagePipeline } from '../combat/DamagePipeline';
import { Footprint } from '../components/Footprint';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { STUCK_DETECTION } from '../content/ai/stuckDetection';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { FORMATIONS } from '../content/mobs/formations/formations';
import { ENRAGING_STRUCTURES } from '../content/mobs/minionModifiers';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { OPENING_WAVE, SPAWN_WAVES } from '../content/structures/spawnWaves';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import type { StructureDefinition } from '../content/structures/structures.types';
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
 * death, capture points, the match director, then invariants last. This is the one place a system
 * is added, at its position in the tick (architecture 02 §9). It builds the match's one
 * `DamagePipeline` and one `StatusEffectApplier` (with the status effects loaded for this match's
 * config) and hands them to the systems that need them, so a damage step applies to every hit and
 * every status event comes from one place.
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
    ruinWall,
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
              { flowFields, forts: DefaultSystemPipeline.fortBoxesOf(state, structures) },
            ),
          ]),
      new CombatSystem(damage),
      ...(state.worldObjects === undefined
        ? []
        : [
            new MapDestructionSystem({
              state,
              damage,
              flowFields,
              ruinWall: DefaultSystemPipeline.requireRuinWall(ruinWall),
            }),
          ]),
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
      new DeathSystem(),
      new CaptureSystem(state.config.match.capturePoints, tickRate),
      // After death, so an objective lost this tick can end the match this tick (12 §1).
      new MatchDirectorSystem(director),
      new InvariantSystem(invariants),
    ]);
  }

  /**
   * The injected `ruinWall`, which a match with map objects needs (DEC-219 (a)).
   *
   * @throws Error when it is missing.
   */
  private static requireRuinWall(ruinWall: ObstacleDefinition | undefined): ObstacleDefinition {
    if (ruinWall === undefined) {
      throw new Error(
        'A match with map objects needs DefaultSystemPipelineOptions.ruinWall: what a standing fort wall becomes when its tower falls',
      );
    }
    return ruinWall;
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
