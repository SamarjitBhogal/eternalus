import type { MapDefinition } from '../content/maps/maps.types';
import { SKETCH_WIDTH, SKETCH_HEIGHT } from '../content/maps/map1Scenery';
import { MapBuildingInteriorBuilder } from './MapBuildingInteriorBuilder';
import { MapSceneryBuilder } from './MapSceneryBuilder';

/** Adds same-world building presentation without altering generated gameplay geometry. */
export class MapLayout {
  /** Dresses a generated battlefield while preserving its dimensions, features and lanes. */
  public build(layout: MapDefinition): MapDefinition {
    const sx = layout.width / SKETCH_WIDTH;
    const sy = layout.height / SKETCH_HEIGHT;
    const buildings = layout.features.filter(
      (f) => f.kind === 'stronghold' || f.kind === 'cathedral',
    );
    const interiors = new MapBuildingInteriorBuilder().build().flatMap((piece) => {
      const feature = buildings.find((f) =>
        piece.buildingId === 'grand-cathedral'
          ? f.kind === 'cathedral'
          : f.kind === 'stronghold' &&
            f.team === (piece.buildingId === 'light-capital' ? 'light' : 'dark'),
      );
      if (feature === undefined) return [];
      const ox = feature.kind === 'cathedral' ? 800 : feature.team === 'light' ? 142 : 1458;
      return [
        {
          ...piece,
          buildingId: feature.id,
          shape: piece.shape.map((p) => ({
            x: (p.x - ox) * sx + feature.position.x,
            y: (p.y - 450) * sy + feature.position.y,
          })),
        },
      ];
    });
    const scenery = new MapSceneryBuilder(layout).build().map((piece) => {
      const feature = buildings.find((f) =>
        f.kind === 'cathedral'
          ? piece.id.startsWith('cathedral-')
          : piece.id.startsWith(`${f.id}-`),
      );
      const isWall = [
        'stronghold-wall',
        'cathedral-buttress',
        'wall-tower',
        'stronghold-court',
        'gate-bridge',
        '-step-',
        'tower-banner',
      ].some((part) => piece.id.includes(part));
      return feature !== undefined && piece.layer === 'detail' && !isWall
        ? { ...piece, buildingId: feature.id, visibility: 'roof' as const }
        : piece;
    });
    return {
      ...layout,
      scenery: [...scenery, ...interiors],
      buildings: buildings.map((feature) => ({
        id: feature.id,
        name: feature.kind === 'cathedral' ? 'Cathedral' : `${feature.team} stronghold`,
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
