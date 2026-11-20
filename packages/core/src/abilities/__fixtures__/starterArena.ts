import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import type { EntityDefinitionBase } from '../../content/EntityDefinition.types';
import { STARTER_ENTITIES } from '../../content/abilities/starterEntities';
import { loadAbilities } from '../../content/abilities/loadAbilities';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadStatusEffects } from '../../content/status-effects/loadStatusEffects';
import { MAP_OBJECT_DEFINITIONS } from '../../content/maps/mapObjectDefinitions';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { DamagePipeline } from '../../combat/DamagePipeline';
import { StatusEffectApplier } from '../../combat/StatusEffectApplier';
import { Abilities } from '../../components/Abilities';
import { CastAbilityHandler } from '../../commands/handlers/CastAbilityHandler';
import type { AbilitySlot } from '../../content/abilities/AbilityDefinition.types';
import { NullLogger } from '../../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import type { Entity } from '../../entities/Entity';
import type { Placement } from '../../entities/EntityFactory.types';
import { CollisionResolver } from '../../physics/CollisionResolver';
import { StaticCollisionIndex } from '../../physics/StaticCollisionIndex';
import { GameState } from '../../state/GameState';
import { WorldObjectStore } from '../../state/WorldObjectStore';
import { AbilityReactionSystem } from '../../systems/AbilityReactionSystem';
import { AbilitySystem } from '../../systems/AbilitySystem';
import { AbilityLifetimeSystem } from '../../systems/AbilityLifetimeSystem';
import { AbilityFormSystem } from '../../systems/AbilityFormSystem';
import { HealingFieldSystem } from '../../systems/HealingFieldSystem';
import { BladeSystem } from '../../systems/BladeSystem';
import { BeamSystem } from '../../systems/BeamSystem';
import { StatusEffectSystem } from '../../systems/StatusEffectSystem';
import { MovementSystem } from '../../systems/MovementSystem';
import { CollisionSystem } from '../../systems/CollisionSystem';
import { CombatSystem } from '../../systems/CombatSystem';
import { DeathSystem } from '../../systems/DeathSystem';
import { SystemPipeline } from '../../systems/SystemPipeline';
import type { Vec2 } from '../../utils/geometry.types';
import { CastValidator } from '../CastValidator';
import { createDefaultAbilityRegistry } from '../defaultAbilityRegistry';

/** A minimal real ability/combat pipeline with controllable actors and a physical wall index. */
export function starterArena(seed = 1) {
  const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
  const index = new StaticCollisionIndex([]);
  const collisions = new CollisionResolver(index, { x: 0, y: 0, width: 100, height: 100 });
  const state = new GameState(config, seed, null, { collisions });
  const definitions = new ContentCatalogue<EntityDefinitionBase>([
    ...loadDefaultContent(30).all(),
    ...STARTER_ENTITIES,
  ]);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    definitions,
    undefined,
    loadWeapons(30),
  );
  const spawn = (definitionId: string, placement: Placement) => {
    const definition = definitions.get(definitionId);
    const entity = factory.create(definition.kind, definitionId, placement);
    state.entities.add(entity);
    state.events.emit('entity-spawned', {
      entityId: entity.id,
      kind: entity.kind,
      team: placement.team ?? 'neutral',
    });
    return entity;
  };
  state.worldObjects = new WorldObjectStore({
    objects: [],
    factory,
    entities: state.entities,
    definitions: MAP_OBJECT_DEFINITIONS,
  });
  state.events.on('entity-removed', ({ entityId }) => {
    state.worldObjects?.removed(entityId);
    index.remove(entityId);
  });
  const registry = createDefaultAbilityRegistry(loadAbilities(30), undefined, spawn);
  const validator = new CastValidator(registry);
  const handler = new CastAbilityHandler(validator);
  const damage = new DamagePipeline();
  const statuses = new StatusEffectApplier(
    loadStatusEffects(30, config.map.spawnTowersPerLane + config.map.buffTowersPerLane),
  );
  const reactions = new AbilityReactionSystem(state, statuses);
  const pipeline = new SystemPipeline([
    reactions,
    new AbilitySystem(registry, validator, damage, statuses),
    new AbilityLifetimeSystem(),
    new HealingFieldSystem(),
    new StatusEffectSystem(damage, statuses),
    new AbilityFormSystem(),
    new MovementSystem(),
    new CollisionSystem(collisions),
    new BladeSystem(registry, damage, statuses),
    new BeamSystem(registry, damage, statuses),
    new CombatSystem(damage),
    new DeathSystem(),
  ]);
  const run = (ticks = 1) => {
    for (let tick = 0; tick < ticks; tick++) {
      state.advanceTick();
      pipeline.run({ state, logger: new NullLogger() });
    }
  };
  const cast = (actorId: string, slot: AbilitySlot, point: Vec2 = { x: 70, y: 50 }) =>
    handler.handle(
      { type: 'cast-ability', actorId, slot, aim: { point, targetId: null } },
      { state, factory },
    );
  const charge = (actorId: string) => {
    const slot = state.entities.get(actorId)?.getComponent(Abilities).slot('ability-4');
    if (slot === undefined) throw new Error('No ultimate slot');
    slot.charge = 1;
  };
  const list = (): Entity[] => {
    const result: Entity[] = [];
    state.entities.forEach((entity) => result.push(entity));
    return result;
  };
  return {
    state,
    factory,
    spawn,
    registry,
    validator,
    damage,
    statuses,
    collisions,
    run,
    cast,
    charge,
    list,
  };
}
