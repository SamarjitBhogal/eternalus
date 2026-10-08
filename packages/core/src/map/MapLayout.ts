import type { MapDefinition } from '../content/maps/maps.types';
import { CAMP_POSITIONS, MAP_1_SCALE } from '../content/maps/map1Scenery';
import { CathedralInteriorBuilder } from './CathedralInteriorBuilder';
import { MapSceneryBuilder } from './MapSceneryBuilder';
import { LANDMARK_SETTINGS } from '../content/maps/map1Landforms';

/** Enlarges an authored map uniformly while preserving every original feature and lane. */
export class MapLayout {
  /** Returns a decorated battlefield at the requested presentation scale. */
  public build(layout: MapDefinition): MapDefinition {
    const scale = MAP_1_SCALE;
    const point = (p: {
      readonly x: number;
      readonly y: number;
    }): { readonly x: number; readonly y: number } => ({ x: p.x * scale, y: p.y * scale });
    return {
      ...layout,
      width: layout.width * scale,
      height: layout.height * scale,
      lanes: layout.lanes.map((lane) => ({ ...lane, path: lane.path.map(point) })),
      terrain: layout.terrain.map((piece) => ({ ...piece, shape: piece.shape.map(point) })),
      features: [
        ...layout.features.map((feature) => ({ ...feature, position: point(feature.position) })),
        ...CAMP_POSITIONS.map((position, index) => ({
          id: `neutral-camp-${String(index)}`,
          kind: 'camp' as const,
          owner: 'neutral' as const,
          position: point(position),
        })),
      ],
      scenery: new MapSceneryBuilder(layout)
        .build()
        .map((piece) => ({ ...piece, shape: piece.shape.map(point) })),
      presentationScale: scale,
      interior: new CathedralInteriorBuilder().build(),
      interiorEntry: {
        halfWidth: LANDMARK_SETTINGS.cathedralHalfWidth * scale,
        halfHeight: LANDMARK_SETTINGS.cathedralHalfHeight * scale,
      },
    };
  }
}
