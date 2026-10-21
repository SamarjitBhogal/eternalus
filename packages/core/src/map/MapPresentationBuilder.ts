import type { MapDefinition, MapPresentation, MapLayout } from '../content/maps/maps.types';
import { SKETCH_WIDTH, SKETCH_HEIGHT } from '../content/maps/map1Scenery';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { MapBuildingInteriorBuilder } from './MapBuildingInteriorBuilder';
import { MapSceneryBuilder } from './MapSceneryBuilder';
import { placePalace } from './buildingPlacement';
/** Builds same-world cutaways without extending or changing the simulation map. */
export class MapPresentationBuilder {
  /** Uses the same layout content as the generator, including custom ring dimensions. */
  public constructor(private readonly layout: MapLayout = DEFAULT_MAP_LAYOUT) {}
  /** Returns independently typed scenery and selectable floor/door silhouettes. */
  public build(map: MapDefinition): MapPresentation {
    const features = map.features.filter((f) => f.kind === 'stronghold' || f.kind === 'cathedral');
    const interiors = features.flatMap((feature) => {
      const pieces = new MapBuildingInteriorBuilder().build(feature);
      if (feature.kind === 'stronghold')
        return placePalace(pieces, feature, this.layout.wallRing, G.palace);
      return pieces.map((piece) => ({
        ...piece,
        shape: piece.shape.map((p) => ({
          x: ((p.x - G.cathedral.x) * map.width) / SKETCH_WIDTH + feature.position.x,
          y: ((p.y - G.cathedral.y) * map.height) / SKETCH_HEIGHT + feature.position.y,
        })),
      }));
    });
    return {
      scenery: [...new MapSceneryBuilder(map, this.layout.wallRing).build(), ...interiors],
      buildings: features.map((feature) => ({
        id: feature.id,
        footprint: interiors
          .filter(
            (piece) =>
              piece.buildingId === feature.id &&
              ((piece.id.endsWith('-floor') && !piece.id.includes('capture')) ||
                piece.id.endsWith('-door')),
          )
          .map((piece) => piece.shape),
      })),
    };
  }
}
