import type { Renderer } from '../engine/Renderer';
import type { MapDefinition, MapFeature } from '@eternalus/core';

import type { WorldLayer } from './SceneView.types';
import {
  FEATURE_SIZES,
  GROUND_COLOR,
  LANE_COLOR,
  LANE_WIDTH,
  NEUTRAL_FEATURE_COLORS,
  TEAM_COLORS,
  TERRAIN_COLORS,
} from './MapView.constants';

/** Team features use their team colour; neutral ones use the colour for their kind. */
const featureColor = (feature: MapFeature): string =>
  feature.owner === 'neutral' ? NEUTRAL_FEATURE_COLORS[feature.kind] : TEAM_COLORS[feature.owner];

/**
 * Draws a map layout: ground, then terrain, then lanes, then features on top.
 * It only reads map data and never changes it.
 */
export class MapView implements WorldLayer {
  private readonly map: MapDefinition;

  /** Creates a view for one map. */
  public constructor(map: MapDefinition) {
    this.map = map;
  }

  /** Draws the whole map through the renderer. */
  public draw(renderer: Renderer): void {
    const { width, height } = this.map;
    renderer.fillPolygon(
      [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ],
      GROUND_COLOR,
    );
    for (const piece of this.map.terrain) {
      renderer.fillPolygon(piece.shape, TERRAIN_COLORS[piece.kind]);
    }
    for (const lane of this.map.lanes) {
      renderer.strokePath(lane.path, LANE_COLOR, LANE_WIDTH);
    }
    for (const feature of this.map.features) {
      renderer.fillSquare(feature.position, FEATURE_SIZES[feature.kind], featureColor(feature));
    }
  }
}
