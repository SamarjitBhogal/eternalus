import type { MapDefinition } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { ScreenRect, WorldPoint, WorldRect } from '../engine/render/Renderer.types';
import {
  MINI_MAP_BACKGROUND_COLOR,
  MINI_MAP_BORDER_COLOR,
  MINI_MAP_BORDER_WIDTH,
  MINI_MAP_MARGIN_RATIO,
  MINI_MAP_VIEW_BOX_COLOR,
  MINI_MAP_VIEW_BOX_WIDTH,
  MINI_MAP_WIDTH_RATIO,
} from './MiniMapView.constants';
import type { WorldLayer } from './SceneView.types';

/**
 * Draws a small copy of the whole map in the bottom-right corner of the screen, with a box
 * showing which part the main view is looking at. It draws the same scene as the main view
 * (each layer's `drawMinimap`, which uses every feature's `minimapGlyph`), so anything added to
 * the scene or the map later (obstacles, units, new structures) shows up here automatically.
 */
export class MiniMapView {
  private readonly map: MapDefinition;
  private readonly scene: WorldLayer;

  /** Creates a mini map that shows `scene` shrunk to fit the whole of `map`. */
  public constructor(map: MapDefinition, scene: WorldLayer) {
    this.map = map;
    this.scene = scene;
  }

  /** Works out where the mini map sits on a screen of the given size, in screen pixels. */
  public areaFor(screenWidth: number, screenHeight: number): ScreenRect {
    const margin = screenWidth * MINI_MAP_MARGIN_RATIO;
    const width = screenWidth * MINI_MAP_WIDTH_RATIO;
    const height = width * (this.map.height / this.map.width);
    return {
      x: screenWidth - margin - width,
      y: screenHeight - margin - height,
      width,
      height,
    };
  }

  /**
   * Turns a click on the screen into the map position it points at, or returns `null` if the
   * click was outside the mini map. Screen positions are in canvas pixels.
   */
  public worldPointAt(
    screenX: number,
    screenY: number,
    screenWidth: number,
    screenHeight: number,
  ): WorldPoint | null {
    const area = this.areaFor(screenWidth, screenHeight);
    const isInside =
      screenX >= area.x &&
      screenX <= area.x + area.width &&
      screenY >= area.y &&
      screenY <= area.y + area.height;
    if (!isInside) {
      return null;
    }
    return {
      x: ((screenX - area.x) / area.width) * this.map.width,
      y: ((screenY - area.y) / area.height) * this.map.height,
    };
  }

  /**
   * Draws the mini map on top of whatever is already on screen. `view` is the part of the
   * world the main view is showing, outlined as a box.
   */
  public draw(
    renderer: Renderer,
    screenWidth: number,
    screenHeight: number,
    view: WorldRect,
  ): void {
    const area = this.areaFor(screenWidth, screenHeight);
    renderer.fillScreenRect(area, MINI_MAP_BACKGROUND_COLOR);
    renderer.fitWorldInArea(this.map.width, this.map.height, area);
    this.scene.drawMinimap(renderer);
    renderer.strokePath(
      [
        { x: view.x, y: view.y },
        { x: view.x + view.width, y: view.y },
        { x: view.x + view.width, y: view.y + view.height },
        { x: view.x, y: view.y + view.height },
        { x: view.x, y: view.y },
      ],
      MINI_MAP_VIEW_BOX_COLOR,
      MINI_MAP_VIEW_BOX_WIDTH,
    );
    renderer.strokeScreenRect(area, MINI_MAP_BORDER_COLOR, MINI_MAP_BORDER_WIDTH);
  }
}
