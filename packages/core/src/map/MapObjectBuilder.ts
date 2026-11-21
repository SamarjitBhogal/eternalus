import type { MapDefinition, MapPresentation } from '../content/maps/maps.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { PlayableTeam } from '../teams/teams.types';
import { MapGenerationError } from './MapGenerationError';

/** Collects explicit authored footprints; floors, roof projections and shadows never block. */
export class MapObjectBuilder {
  /**
   * Reuses the same world-space polygons that draw each physical object's solid surfaces.
   *
   * @throws MapGenerationError when a footprint has fewer than 3 points: it would block nothing
   *   yet sit in reach of every attacker.
   */
  public build(map: MapDefinition, presentation: MapPresentation): readonly MapObject[] {
    const objects = new Map<string, MapObject>();
    const passages = presentation.scenery
      .filter((piece) => piece.isPassage === true)
      .map((piece) => piece.shape);
    for (const piece of presentation.scenery) {
      const art = piece.object;
      if (art?.isFootprint !== true) continue;
      const previous = objects.get(art.id);
      objects.set(art.id, {
        id: art.id,
        kind: art.kind,
        ...(art.kind === 'terrain' ? { passages } : {}),
        footprints: [...(previous?.footprints ?? []), piece.shape],
        isBlocking: true,
        ...(piece.buildingId === undefined ? {} : { buildingId: piece.buildingId }),
        ...(piece.visibility === 'interior' ? { isInterior: true as const } : {}),
        ...(art.partOf === undefined ? {} : { partOf: art.partOf }),
      });
    }
    for (const feature of map.features) {
      // Main-building floors and gate passages must stay walkable. Their walls are separate objects.
      if (
        (feature.kind === 'wall-segment' ||
          feature.kind === 'turret' ||
          feature.kind === 'obstacle') &&
        feature.footprint !== undefined
      ) {
        objects.set(feature.id, {
          id: feature.id,
          kind: feature.kind === 'wall-segment' ? 'wall' : 'rock',
          footprints: [feature.footprint],
          isBlocking: true,
        });
      }
    }
    for (const feature of map.features) {
      if (
        feature.kind === 'gate' ||
        feature.kind === 'stronghold' ||
        feature.kind === 'cathedral'
      ) {
        const building = presentation.buildings.find((b) => b.id === feature.id);
        const footprints =
          building?.footprint ?? (feature.footprint === undefined ? [] : [feature.footprint]);
        objects.set(feature.id, {
          id: feature.id,
          kind: feature.kind,
          footprints,
          isBlocking: false,
        });
      }
      if (feature.kind === 'turret') {
        const object = objects.get(feature.id);
        if (object !== undefined) objects.set(feature.id, { ...object, kind: 'turret' });
      }
      if (feature.kind === 'spawner-tower' || feature.kind === 'buff-tower') {
        const object = objects.get(feature.id);
        if (object !== undefined) objects.set(feature.id, { ...object, kind: feature.kind });
      }
    }
    const built = [...objects.values()];
    const degenerate = built.find(({ footprints }) => footprints.some((shape) => shape.length < 3));
    if (degenerate !== undefined) {
      throw new MapGenerationError(
        `Map object ${degenerate.id} has a footprint with fewer than 3 points.`,
      );
    }
    return MapObjectBuilder.withTeams(map, built);
  }

  /** Gives each object of a side's feature, or built inside one (its palace), that side's team. */
  private static withTeams(map: MapDefinition, objects: readonly MapObject[]): MapObject[] {
    const teams = new Map<string, PlayableTeam>();
    for (const { id, team } of map.features) if (team !== 'neutral') teams.set(id, team);
    return objects.map((object) => {
      const team = teams.get(object.id) ?? teams.get(object.buildingId ?? '');
      return team === undefined ? object : { ...object, team };
    });
  }
}
