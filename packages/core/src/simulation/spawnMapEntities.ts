import { Footprint } from '../components/Footprint';
import type { MapObject } from '../content/maps/mapObjects.types';
import { ZONE_PLACEMENTS } from '../content/zones/zoneCatalogue';
import type { EntityFactory } from '../entities/EntityFactory';
import { zoneAreaOf } from '../map/zoneArea';
import type { StructureSource } from '../Simulation.types';
import type { GameEventMap } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import { compareById } from '../utils/compareById';

/**
 * Builds the map's structures, in feature id order, before anything else spawns (architecture
 * 07 §1): every feature whose definition is a structure becomes that structure, with its team
 * and lane. Features without a structure definition (walls, turrets, corner camps) stay map data.
 * A structure whose definition `hasMapFootprint` takes the footprints of its feature's map object
 * of the same id as its `Footprint` (a lane tower's fort, DEC-185; the Stronghold's palace,
 * DEC-185 D; a gate's own outline, DEC-217 (17)). A blocking such object (a fort) is the
 * structure's body: it has no health of its own (one pool, DEC-185 B). Only towers share one
 * pool (DEC-217 (13)): the palace's and the gates' objects do not block, so they keep their own
 * health. A Duel does not build the structures its `omittedStructureIds` list (DEC-348: towers,
 * gates, camps and Strongholds; the Cathedral's gem stays).
 *
 * @returns Map object id → the id of the structure it is the body of.
 */
export const spawnStructures = (
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
): ReadonlyMap<string, string> => {
  const features = [...(state.world?.definition.features ?? [])].sort((a, b) =>
    compareById(a.id, b.id),
  );
  const bodies = new Map(mapObjects.map((object) => [object.id, object]));
  const owners = new Map<string, string>();
  for (const { id, definitionId, position, team, laneId } of features) {
    if (structures.has(definitionId) && !omittedIds.includes(definitionId)) {
      const { kind, hasMapFootprint } = structures.get(definitionId);
      const placement = {
        position,
        team,
        mapFeatureId: id,
        ...(laneId !== undefined && { laneId }),
      };
      const structure = factory.create(kind, definitionId, placement);
      const body = hasMapFootprint === true ? bodies.get(id) : undefined;
      if (body !== undefined) structure.addComponent(new Footprint(body.footprints));
      if (body?.isBlocking === true) owners.set(body.id, structure.id);
      state.entities.add(structure);
    }
  }
  return owners;
};

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
export const spawnZones = (
  state: GameState,
  factory: EntityFactory,
): GameEventMap['entity-spawned'][] => {
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
};
