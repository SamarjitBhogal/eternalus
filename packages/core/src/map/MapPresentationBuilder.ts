import type {
  MapDecoration,
  MapDefinition,
  MapFeature,
  MapPresentation,
} from '../content/maps/maps.types';
import { SKETCH_WIDTH, SKETCH_HEIGHT } from '../content/maps/map1Scenery';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MapBuildingInteriorBuilder } from './MapBuildingInteriorBuilder';
import { MapSceneryBuilder } from './MapSceneryBuilder';
import { MapPalaceWallsBuilder } from './MapPalaceWallsBuilder';
import { placePalace } from './buildingPlacement';
import { strongholdRing } from './strongholdRing';
import type { InteriorPlacements } from './MapPresentationBuilder.types';
import type { Polygon } from '../utils/geometry.types';

/** Builds same-world cutaways from generated anchors and explicitly tagged authored floors. */
export class MapPresentationBuilder {
  private readonly placements: InteriorPlacements = {
    stronghold: (pieces, map, feature) =>
      placePalace(pieces, feature, strongholdRing(map, feature), G.palace),
    cathedral: (pieces, map, feature) =>
      pieces.map((piece) => ({
        ...piece,
        shape: piece.shape.map((point) => ({
          x: ((point.x - G.cathedral.x) * map.width) / SKETCH_WIDTH + feature.position.x,
          y: ((point.y - G.cathedral.y) * map.height) / SKETCH_HEIGHT + feature.position.y,
        })),
      })),
  };
  /** Returns independently typed scenery and selectable floor/door silhouettes. */
  public build(map: MapDefinition): MapPresentation {
    const interiors = map.features
      .filter((feature) => this.placements[feature.kind] !== undefined)
      .map((feature) => ({ feature, pieces: this.interiorOf(map, feature) }));
    return {
      scenery: [
        ...new MapSceneryBuilder(map).build(),
        ...interiors.flatMap(({ pieces }) => pieces),
        ...interiors
          .filter(({ feature }) => feature.kind === 'stronghold')
          .flatMap(({ feature }) =>
            new MapPalaceWallsBuilder().build(feature, map, strongholdRing(map, feature)),
          ),
      ],
      buildings: interiors.map(({ feature, pieces }) => ({
        id: feature.id,
        footprint: MapPresentationBuilder.footprintIn(pieces),
      })),
    };
  }

  /**
   * The placed floor polygons of one building, in world units: the same polygons `build` gives as
   * its footprint. Builds only that building's interior, so it is cheap enough for match setup.
   */
  public footprintOf(map: MapDefinition, feature: MapFeature): readonly Polygon[] {
    return MapPresentationBuilder.footprintIn(this.interiorOf(map, feature));
  }

  /** The placed interior pieces of one building; none for a kind without a placement. */
  private interiorOf(map: MapDefinition, feature: MapFeature): readonly MapDecoration[] {
    return (
      this.placements[feature.kind]?.(
        new MapBuildingInteriorBuilder().build(feature),
        map,
        feature,
      ) ?? []
    );
  }

  private static footprintIn(pieces: readonly MapDecoration[]): readonly Polygon[] {
    return pieces.filter((piece) => piece.isFootprint === true).map((piece) => piece.shape);
  }
}
