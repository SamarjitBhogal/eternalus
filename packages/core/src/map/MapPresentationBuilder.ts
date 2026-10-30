import type { MapDefinition, MapPresentation } from '../content/maps/maps.types';
import { SKETCH_WIDTH, SKETCH_HEIGHT } from '../content/maps/map1Scenery';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MapBuildingInteriorBuilder } from './MapBuildingInteriorBuilder';
import { MapSceneryBuilder } from './MapSceneryBuilder';
import { MapPalaceWallsBuilder } from './MapPalaceWallsBuilder';
import { placePalace } from './buildingPlacement';
import { strongholdRing } from './strongholdRing';
import type { InteriorPlacements } from './MapPresentationBuilder.types';

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
    const features = map.features.filter((feature) => this.placements[feature.kind] !== undefined);
    const interiors = features.flatMap(
      (feature) =>
        this.placements[feature.kind]?.(
          new MapBuildingInteriorBuilder().build(feature),
          map,
          feature,
        ) ?? [],
    );
    return {
      scenery: [
        ...new MapSceneryBuilder(map).build(),
        ...interiors,
        ...features
          .filter((feature) => feature.kind === 'stronghold')
          .flatMap((feature) =>
            new MapPalaceWallsBuilder().build(feature, map, strongholdRing(map, feature)),
          ),
      ],
      buildings: features.map((feature) => ({
        id: feature.id,
        footprint: interiors
          .filter((piece) => piece.buildingId === feature.id && piece.isFootprint === true)
          .map((piece) => piece.shape),
      })),
    };
  }
}
