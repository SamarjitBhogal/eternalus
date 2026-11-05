import type { MapDefinition } from '@eternalus/core';

import { MinimapProjection } from '../engine/camera/MinimapProjection';
import type { Renderer } from '../engine/render/Renderer';
import type { ScreenRect, WorldPoint } from '../engine/render/Renderer.types';
import {
  MINI_MAP_BACKGROUND_COLOR,
  MINI_MAP_CENTER_COLOR,
  MINI_MAP_CENTER_GLYPH,
  MINI_MAP_VIEW_RADIUS,
} from './MiniMapView.constants';
import type { MiniMapRing } from './MiniMapView.types';
import type { WorldLayer } from './SceneView.types';

/**
 * Draws a local view of the map inside the HUD's minimap ring (top right): the circle of
 * `MINI_MAP_VIEW_RADIUS` world units around a centre point (the player), filling the ring, with
 * north up and a marker at the middle. Everything is clipped to the ring's ellipse;
 * the ring itself is the DOM's (`MinimapPanel`), so no border is drawn here. It draws the same
 * scene as the main view (each layer's `drawMinimap`: every feature's `minimapGlyph`, and the
 * units through the `ViewRegistry`), so anything added to the scene or the map later shows up
 * here automatically.
 */
export class MiniMapView {
  /**
   * Creates a mini map that shows `scene` around a point of `map`, inside `ring`. `centre` is
   * the rule for the world point at the ring's middle (both injected by `Match`, 06 §10).
   */
  public constructor(
    private readonly map: MapDefinition,
    private readonly scene: WorldLayer,
    private readonly ring: MiniMapRing,
    private readonly centre: () => WorldPoint,
  ) {}

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
   * Where the local view is drawn: the smallest square that covers the ring's inside (the ring's
   * ellipse inset by its stroke), centred in the ring. The circle of `MINI_MAP_VIEW_RADIUS`
   * world units around the player then fills the ring, with its edge just past the ring's
   * shorter side.
   */
  public viewAreaFor(screenWidth: number, screenHeight: number): ScreenRect {
    const area = this.areaFor(screenWidth, screenHeight);
    const inset = this.ring.strokeWidth * this.scaleFor(screenWidth, screenHeight);
    const side = Math.max(area.width, area.height) - inset * 2;
    return {
      x: area.x + (area.width - side) / 2,
      y: area.y + (area.height - side) / 2,
      width: side,
      height: side,
    };
  }

  /**
   * Turns a click on the screen into the map position drawn under it, or returns `null` if the
   * click was outside the ring's ellipse. Points past the map's edge clamp to it. Screen
   * positions are in canvas pixels.
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
    const point = this.projectionFor(screenWidth, screenHeight).worldAt(screenX, screenY);
    const clamp = (value: number, max: number): number => Math.max(0, Math.min(max, value));
    return { x: clamp(point.x, this.map.width), y: clamp(point.y, this.map.height) };
  }

  /**
   * Draws the mini map on top of whatever is already on screen, clipped to the ring's ellipse:
   * the scene within `MINI_MAP_VIEW_RADIUS` of the centre (north up), then a marker at the middle.
   */
  public draw(renderer: Renderer, screenWidth: number, screenHeight: number): void {
    const area = this.areaFor(screenWidth, screenHeight);
    const projection = this.projectionFor(screenWidth, screenHeight);
    renderer.clipToEllipse(area, () => {
      renderer.fillScreenRect(area, MINI_MAP_BACKGROUND_COLOR);
      projection.apply(renderer);
      this.scene.drawMinimap(renderer);
      renderer.drawGlyph(MINI_MAP_CENTER_GLYPH, projection.centre, MINI_MAP_CENTER_COLOR);
    });
  }

  /** This frame's projection: the circle around the centre across the view area. */
  private projectionFor(screenWidth: number, screenHeight: number): MinimapProjection {
    const viewArea = this.viewAreaFor(screenWidth, screenHeight);
    return new MinimapProjection(this.centre(), MINI_MAP_VIEW_RADIUS, viewArea);
  }

  /** Device pixels per design pixel: the ring scales with the smaller screen dimension. */
  private scaleFor(screenWidth: number, screenHeight: number): number {
    const { frame } = this.ring;
    return Math.min(screenWidth / frame.width, screenHeight / frame.height);
  }
}
