import type { MapDefinition } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { ScreenRect, WorldPoint, WorldRect } from '../engine/render/Renderer.types';
import {
  MINI_MAP_BACKGROUND_COLOR,
  MINI_MAP_VIEW_BOX_COLOR,
  MINI_MAP_VIEW_BOX_WIDTH,
} from './MiniMapView.constants';
import type { MiniMapRing } from './MiniMapView.types';
import type { WorldLayer } from './SceneView.types';

/**
 * Draws a small copy of the whole map inside the HUD's minimap ring (top right), with a box
 * showing which part the main view is looking at. Everything is clipped to the ring's ellipse;
 * the ring itself is the DOM's (`MinimapPanel`), so no border is drawn here. It draws the same
 * scene as the main view (each layer's `drawMinimap`, which uses every feature's `minimapGlyph`),
 * so anything added to the scene or the map later shows up here automatically.
 */
export class MiniMapView {
  private readonly map: MapDefinition;
  private readonly scene: WorldLayer;
  private readonly ring: MiniMapRing;

  /**
   * Creates a mini map that shows `scene` shrunk to fit the whole of `map`, inside `ring`
   * (injected by `Match`, 06 §10).
   */
  public constructor(map: MapDefinition, scene: WorldLayer, ring: MiniMapRing) {
    this.map = map;
    this.scene = scene;
    this.ring = ring;
  }

  /** The ring's ellipse box on a screen of the given size, in screen pixels. */
  public areaFor(screenWidth: number, screenHeight: number): ScreenRect {
    const { box } = this.ring;
    const scale = this.scaleFor(screenWidth, screenHeight);
    return {
      x: screenWidth - (box.right + box.width) * scale,
      y: box.top * scale,
      width: box.width * scale,
      height: box.height * scale,
    };
  }

  /**
   * Where the whole map is drawn: the largest rectangle with the map's shape that fits inside
   * the ring's stroke, centred in the ring.
   */
  public mapAreaFor(screenWidth: number, screenHeight: number): ScreenRect {
    const area = this.areaFor(screenWidth, screenHeight);
    const inset = this.ring.strokeWidth * this.scaleFor(screenWidth, screenHeight);
    const radiusX = area.width / 2 - inset;
    const radiusY = area.height / 2 - inset;
    const aspect = this.map.width / this.map.height;
    // The rectangle's corner touches the inner ellipse: (hw / rx)² + (hh / ry)² = 1, hw = aspect·hh.
    const halfHeight = 1 / Math.hypot(aspect / radiusX, 1 / radiusY);
    const halfWidth = aspect * halfHeight;
    return {
      x: area.x + area.width / 2 - halfWidth,
      y: area.y + area.height / 2 - halfHeight,
      width: halfWidth * 2,
      height: halfHeight * 2,
    };
  }

  /**
   * Turns a click on the screen into the map position it points at, or returns `null` if the
   * click was outside the ring's ellipse. Points between the map and the ring clamp to the map's
   * edge. Screen positions are in canvas pixels.
   */
  public worldPointAt(
    screenX: number,
    screenY: number,
    screenWidth: number,
    screenHeight: number,
  ): WorldPoint | null {
    const area = this.areaFor(screenWidth, screenHeight);
    const radiusX = area.width / 2;
    const radiusY = area.height / 2;
    const dx = (screenX - area.x - radiusX) / radiusX;
    const dy = (screenY - area.y - radiusY) / radiusY;
    // Written as "not inside" so a 0 × 0 screen (NaN distance, before the first resize) is outside.
    const isInside = dx * dx + dy * dy <= 1;
    if (!isInside) {
      return null;
    }
    const mapArea = this.mapAreaFor(screenWidth, screenHeight);
    const clamp = (value: number, max: number): number => Math.max(0, Math.min(max, value));
    return {
      x: clamp(((screenX - mapArea.x) / mapArea.width) * this.map.width, this.map.width),
      y: clamp(((screenY - mapArea.y) / mapArea.height) * this.map.height, this.map.height),
    };
  }

  /**
   * Draws the mini map on top of whatever is already on screen, clipped to the ring's ellipse.
   * `view` is the part of the world the main view is showing, outlined as a box.
   */
  public draw(
    renderer: Renderer,
    screenWidth: number,
    screenHeight: number,
    view: WorldRect,
  ): void {
    const area = this.areaFor(screenWidth, screenHeight);
    const mapArea = this.mapAreaFor(screenWidth, screenHeight);
    renderer.clipToEllipse(area, () => {
      renderer.fillScreenRect(area, MINI_MAP_BACKGROUND_COLOR);
      renderer.fitWorldInArea(this.map.width, this.map.height, mapArea);
      this.scene.drawMinimap(renderer);
      this.drawViewBox(renderer, view);
    });
  }

  /** Outlines `view`, clamped to the map so it never reaches past the map's edge. */
  private drawViewBox(renderer: Renderer, view: WorldRect): void {
    const left = Math.max(0, view.x);
    const top = Math.max(0, view.y);
    const right = Math.min(this.map.width, view.x + view.width);
    const bottom = Math.min(this.map.height, view.y + view.height);
    renderer.strokePath(
      [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom },
        { x: left, y: top },
      ],
      MINI_MAP_VIEW_BOX_COLOR,
      MINI_MAP_VIEW_BOX_WIDTH,
    );
  }

  /** Device pixels per design pixel: the ring scales with the smaller screen dimension. */
  private scaleFor(screenWidth: number, screenHeight: number): number {
    const { frame } = this.ring;
    return Math.min(screenWidth / frame.width, screenHeight / frame.height);
  }
}
