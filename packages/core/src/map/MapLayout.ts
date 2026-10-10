import type { MapDefinition } from '../content/maps/maps.types';
import { CAMP_POSITIONS, MAP_1_SCALE } from '../content/maps/map1Scenery';
import { MapBuildingInteriorBuilder } from './MapBuildingInteriorBuilder';
import { MapSceneryBuilder } from './MapSceneryBuilder';

/** Enlarges an authored map uniformly while preserving every original feature and lane. */
export class MapLayout {
  /** Returns a decorated battlefield at the requested presentation scale. */
  public build(layout: MapDefinition): MapDefinition {
    const scale = MAP_1_SCALE;
    const interiors = new MapBuildingInteriorBuilder().build();
    const scenery = new MapSceneryBuilder(layout).build().map((piece) => {
      const id = piece.id.startsWith('cathedral-')
        ? 'grand-cathedral'
        : piece.id.startsWith('light-capital-')
          ? 'light-capital'
          : piece.id.startsWith('dark-capital-')
            ? 'dark-capital'
            : undefined;
      const isWall =
        piece.id.includes('stronghold-wall') ||
        piece.id.includes('cathedral-buttress') ||
        piece.id.includes('wall-tower') ||
        piece.id.includes('stronghold-court') ||
        piece.id.includes('gate-bridge') ||
        piece.id.includes('-step-') ||
        piece.id.includes('tower-banner');
      return id !== undefined && piece.layer === 'detail' && !isWall
        ? { ...piece, buildingId: id, visibility: 'roof' as const }
        : piece;
    });
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
      scenery: [...scenery, ...interiors].map((piece) => ({
        ...piece,
        shape: piece.shape.map(point),
      })),
      presentationScale: scale,
      buildings: ['grand-cathedral', 'light-capital', 'dark-capital'].map((id) => ({
        id,
        name:
          id === 'grand-cathedral'
            ? 'Cathedral'
            : id === 'light-capital'
              ? 'Light stronghold'
              : 'Dark stronghold',
        footprint: interiors
          .filter(
            (piece) =>
              piece.buildingId === id &&
              ((piece.id.endsWith('-floor') && !piece.id.includes('capture')) ||
                piece.id.endsWith('-door')),
          )
          .map((piece) => piece.shape.map(point)),
      })),
    };
  }
}
