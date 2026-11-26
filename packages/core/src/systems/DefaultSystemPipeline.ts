import { CastValidator } from '../abilities/CastValidator';
import { checkStatusLinks } from '../abilities/checkStatusLinks';
import { createDefaultAbilityRegistry } from '../abilities/defaultAbilityRegistry';
import { HitEffects } from '../abilities/HitEffects';
import { TargetQuery } from '../abilities/TargetQuery';
import { DamagePipeline } from '../combat/DamagePipeline';
import { Footprint } from '../components/Footprint';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { AETHER_REGEN } from '../content/abilities/aetherRegen';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { loadStuckDetection } from '../content/ai/loadStuckDetection';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { loadOutOfCombatHealing } from '../content/healing/loadOutOfCombatHealing';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { FORMATIONS } from '../content/mobs/formations/formations';
import { ENRAGING_STRUCTURES } from '../content/mobs/minionModifiers';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { loadSpawnWaves } from '../content/structures/loadSpawnWaves';
import { OPENING_WAVE } from '../content/structures/spawnWaves';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { StructureDefinition } from '../content/structures/structures.types';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { LaneFlowFields } from '../map/LaneFlowFields';
import { AbilitySystem } from './AbilitySystem';
import { AetherRegenSystem } from './AetherRegenSystem';
import { AreaHitQuery } from '../state/AreaHitQuery';
import type { GameState } from '../state/GameState';
import { ReachQuery } from '../state/ReachQuery';
import type { Rect } from '../utils/geometry.types';
import { CaptureSystem } from './CaptureSystem';
import { CombatSystem } from './CombatSystem';
import { MapDestructionSystem } from './MapDestructionSystem';
import { DeathSystem } from './DeathSystem';
import type { DefaultSystemPipelineOptions } from './DefaultSystemPipeline.types';
import { DuelRoundSystem } from './DuelRoundSystem';
import { EnragedSystem } from './EnragedSystem';
import { HordeSystem } from './HordeSystem';
import { InvariantSystem } from './InvariantSystem';
import { MatchDirectorSystem } from './MatchDirectorSystem';
import { MovementSystem } from './MovementSystem';
import { OutOfCombatHealingSystem } from './OutOfCombatHealingSystem';
import { PathingSystem } from './PathingSystem';
import { createDefaultProjectileImpacts } from './defaultProjectileImpacts';
import { ProjectileSystem } from './ProjectileSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { SpaceSystem } from './SpaceSystem';
import { SpawnSystem } from './SpawnSystem';
import { StructureSystem } from './StructureSystem';
import { StuckSystem } from './StuckSystem';
import { VeterancySystem } from './VeterancySystem';
import { loadMinionVeterancy } from '../content/mobs/loadMinionVeterancy';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { ZONE_LOCKING_MOBS } from '../content/zones/zoneLocks';
import { loadGuardPlans } from '../content/structures/loadGuardPlans';
import { StatusEffectSystem } from './StatusEffectSystem';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order (architecture 10 §9, 11 §1, 18 §3.2): the AI, horde
 * progress, the queued casts, aether regeneration, statuses, movement, collision (DEC-121 (c):
 * every later reader sees resolved positions), the neighbour index, stuck detection (DEC-193),
 * steering, the shots in flight, combat, map destruction, progression (kill XP), minion veterancy,
 * structure losses and breakability, spawning, enraging, out-of-combat healing (DEC-188), death,
 * capture points, the match director, then invariants last. Combat runs after movement, so a unit
 * with a target in reach faces it, not its own way (DEC-192). This is the one place a system is
 * added, at its position in the tick (architecture 02 §9). It builds the match's one
 * `DamagePipeline`, one `StatusEffectApplier` (with the status effects loaded for this match's
 * config, checked against the ability registry: `checkStatusLinks`) and one `TargetQuery`, and
 * hands them to the systems that need them, so a damage step applies to every hit and every status
 * event comes from one place. What a landed shot does is one `ProjectileImpact` per impact kind,
 * from `createDefaultProjectileImpacts`; the match's one `EntityFactory` builds the shots
 * `CombatSystem` fires and the units `SpawnSystem` spawns.
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /** Creates the pipeline from its injected parts (`DefaultSystemPipelineOptions`). */
  public constructor({
    invariants,
    state,
    factory,
    progression,
    director,
    duelStarts,
    hordes,
    abilities = createDefaultAbilityRegistry(
      loadAbilities(state.config.tickRate),
      state.config.tickRate,
    ),
    validator = new CastValidator(abilities),
    structures = STRUCTURE_DEFINITIONS,
    areas = new AreaHitQuery(),
    reach = new ReachQuery(),
  }: DefaultSystemPipelineOptions) {
    const { tickRate, map } = state.config;
    const damage = new DamagePipeline();
    const statusEffects = loadStatusEffects(
      tickRate,
      map.spawnTowersPerLane + map.buffTowersPerLane,
    );
    checkStatusLinks(abilities, statusEffects.all());
    const statuses = new StatusEffectApplier(statusEffects);
    const targets = new TargetQuery(abilities, areas);
    const hits = new HitEffects(abilities, damage, statuses, targets);
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
      new AbilitySystem(abilities, validator, damage, statuses, targets),
      // After the casts, so a cast spends before the tick's regeneration (plan arch call 13).
      new AetherRegenSystem(AETHER_REGEN, tickRate),
      new StatusEffectSystem(damage, statuses),
      new MovementSystem(),
      ...(hordes?.collisions ?? []),
      ...(hordes === undefined
        ? []
        : [
            ...(hordes.space === null ? [] : [new SpaceSystem(hordes.space)]),
            new StuckSystem(loadStuckDetection(tickRate), reach),
            new PathingSystem(
              createDefaultStrategyRegistry().movement,
              FORMATIONS,
              HORDE_STEERING.slotArrivalRadius,
              reach,
              { flowFields, forts: DefaultSystemPipeline.fortBoxesOf(state, structures) },
            ),
          ]),
      // Before combat, so a shot fired this tick flies a tick before it can land.
      new ProjectileSystem(createDefaultProjectileImpacts(damage, hits), areas),
      new CombatSystem({ damage, factory, areas, reach, hits }),
      ...(state.worldObjects === undefined ? [] : [new MapDestructionSystem(state, damage)]),
      // Every system that deals damage runs before this one, so a kill is awarded in its own tick.
      new ProgressionSystem(state, progression),
      new VeterancySystem(state, statuses, progression.units, loadMinionVeterancy(tickRate)),
      new StructureSystem(structures),
      ...(hordes === undefined
        ? []
        : [
            new SpawnSystem(state, factory, {
              definitions: factory.definitions,
              openingWave: OPENING_WAVE,
              waves: loadSpawnWaves(tickRate),
              steering: HORDE_STEERING,
              weights: LANE_ASSESSMENT_WEIGHTS,
              formationId: RANKS_FORMATION.id,
              guards: loadGuardPlans(tickRate, hordes.guards),
            }),
            new EnragedSystem(state, statuses, ENRAGING_STRUCTURES),
          ]),
      // Before death, so a fallen Duel Legend is healed and moved instead of removed.
      ...(duelStarts === undefined ? [] : [new DuelRoundSystem(duelStarts, statuses)]),
      new OutOfCombatHealingSystem(state, loadOutOfCombatHealing(tickRate)),
      new DeathSystem(),
      new CaptureSystem(state.config.match.capturePoints, tickRate, ZONE_LOCKING_MOBS),
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
