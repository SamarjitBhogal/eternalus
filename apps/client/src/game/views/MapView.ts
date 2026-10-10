import type { MapDecoration, MapDefinition, MapFeature } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import {
  FEATURE_STYLES,
  GROUND_COLOR,
  LANE_COLOR,
  LANE_WIDTH,
  MINIMAP_ROLE_COLORS,
  NEUTRAL_FEATURE_COLORS,
  TEAM_COLORS,
  TERRAIN_COLORS,
} from './MapView.constants';
import type { WorldLayer } from './SceneView.types';
import { SceneryView } from './SceneryView';

/**
 * Draws a map layout: ground, then ground scenery, then terrain, then lanes, then features on top. Features are
 * drawn by looking their kind up in `FEATURE_STYLES` (main view) or by their own
 * `minimapGlyph` (mini map), so no code here branches on a feature kind.
 * It only reads map data and never changes it.
 */
export class MapView implements WorldLayer {
  private readonly map: MapDefinition;
  private readonly groundScenery: SceneryView;

  /** Creates a view for one map; `scenery` supplies its ground-layer decorations. */
  public constructor(
    map: MapDefinition,
    scenery: readonly MapDecoration[] = [],
    private readonly hiddenRoofs: ReadonlySet<string> = new Set(),
  ) {
    this.map = map;
    this.groundScenery = new SceneryView(scenery, 'ground', hiddenRoofs);
  }

  /** Draws the whole map for the main view. */
  public draw(renderer: Renderer): void {
    this.drawGround(renderer);
    for (const feature of this.map.features) {
      if (this.hiddenRoofs.has(feature.id)) continue;
      const style = FEATURE_STYLES[feature.kind];
      const color = MapView.featureColor(feature);
      if (style.shape === 'footprint') {
        renderer.fillPolygon(feature.footprint ?? [], color);
      } else {
        renderer.drawWorldGlyph({ shape: style.shape, size: style.size }, feature.position, color);
      }
    }
  }

  /** Draws the whole map for the mini map: the ground, then one marker per feature. */
  public drawMinimap(renderer: Renderer): void {
    this.drawGround(renderer);
    for (const feature of this.map.features) {
      if (this.hiddenRoofs.has(feature.id)) continue;
      renderer.drawGlyph(feature.minimapGlyph, feature.position, MapView.minimapColor(feature));
    }
  }

  /** Team features use their team colour; neutral ones use the colour for their kind. */
  private static featureColor(feature: MapFeature): string {
    return feature.team === 'neutral'
      ? NEUTRAL_FEATURE_COLORS[feature.kind]
      : TEAM_COLORS[feature.team];
  }

  /** Team-role glyphs take the owner's colour; every other role has its own colour. */
  private static minimapColor(feature: MapFeature): string {
    const role = feature.minimapGlyph.colourRole;
    if (role === 'team' && feature.team !== 'neutral') {
      return TEAM_COLORS[feature.team];
    }
    return MINIMAP_ROLE_COLORS[role];
  }

  /** The ground, its scenery, the terrain shapes and the lanes, shared by both views. */
  private drawGround(renderer: Renderer): void {
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
    this.groundScenery.draw(renderer);
    for (const piece of this.map.terrain) {
      renderer.fillPolygon(piece.shape, TERRAIN_COLORS[piece.kind]);
    }
    for (const lane of this.map.lanes) {
      renderer.strokePath(lane.path, LANE_COLOR, LANE_WIDTH);
    }
  }
}
