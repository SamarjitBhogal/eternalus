import type { EntitySnapshot, MapDefinition } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { ScreenRect, WorldPoint, WorldRect } from '../engine/render/Renderer.types';
import { NEUTRAL_ENTITY_COLOR } from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';
import {
  MINI_MAP_BACKGROUND_COLOR,
  MINI_MAP_CENTER_COLOR,
  MINI_MAP_CENTER_GLYPH,
  MINI_MAP_LEGEND_GLYPH,
  MINI_MAP_MOB_GLYPH,
  MINI_MAP_VIEW_RADIUS,
} from './MiniMapView.constants';
import type { MiniMapRing } from './MiniMapView.types';
import type { WorldLayer } from './SceneView.types';

/**
 * Draws a local view of the map inside the HUD's minimap ring (top right): the circle of
 * `MINI_MAP_VIEW_RADIUS` world units around a centre point (the player), filling the ring, with
 * north up and a marker at the middle. Everything is clipped to the ring's ellipse;
 * the ring itself is the DOM's (`MinimapPanel`), so no border is drawn here. It draws the same
 * scene as the main view (each layer's `drawMinimap`, which uses every feature's `minimapGlyph`),
 * so anything added to the scene or the map later shows up here automatically.
 */
export class MiniMapView {
  private readonly map: MapDefinition;
  private readonly scene: WorldLayer;
  private readonly ring: MiniMapRing;

  /**
   * Creates a mini map that shows `scene` around a point of `map`, inside `ring`
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
   * Turns a click on the screen into the map position it points at, or returns `null` if the
   * click was outside the ring's ellipse. `center` is the world point shown at the ring's centre
   * (as passed to `draw`). Points past the map's edge clamp to it. Screen positions are in canvas
   * pixels.
   */
  public worldPointAt(
    screenX: number,
    screenY: number,
    screenWidth: number,
    screenHeight: number,
    center: WorldPoint,
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
    const viewArea = this.viewAreaFor(screenWidth, screenHeight);
    const worldPerPixel = (MINI_MAP_VIEW_RADIUS * 2) / viewArea.width;
    const clamp = (value: number, max: number): number => Math.max(0, Math.min(max, value));
    return {
      x: clamp(center.x + (screenX - area.x - radiusX) * worldPerPixel, this.map.width),
      y: clamp(center.y + (screenY - area.y - radiusY) * worldPerPixel, this.map.height),
    };
  }

  /**
   * Draws the mini map on top of whatever is already on screen, clipped to the ring's ellipse:
   * the world within `MINI_MAP_VIEW_RADIUS` of `center` (north up), the living Legends and mobs
   * of `entities` inside that circle as team-coloured dots (Legends larger, on top), and a marker
   * at the middle. The entity `playerId` has no dot: the centre marker is it (DEC-187).
   */
  public draw(
    renderer: Renderer,
    screenWidth: number,
    screenHeight: number,
    center: WorldPoint,
    entities: readonly EntitySnapshot[] = [],
    playerId: string | null = null,
  ): void {
    const area = this.areaFor(screenWidth, screenHeight);
    const viewArea = this.viewAreaFor(screenWidth, screenHeight);
    renderer.clipToEllipse(area, () => {
      renderer.fillScreenRect(area, MINI_MAP_BACKGROUND_COLOR);
      renderer.showWorldArea(MiniMapView.worldViewAround(center), viewArea);
      this.scene.drawMinimap(renderer);
      MiniMapView.drawUnits(renderer, center, entities, playerId);
      renderer.drawGlyph(MINI_MAP_CENTER_GLYPH, center, MINI_MAP_CENTER_COLOR);
    });
  }

  /** One pass: mobs first, then Legends over them. Skips the dead, the player and the far. */
  private static drawUnits(
    renderer: Renderer,
    center: WorldPoint,
    entities: readonly EntitySnapshot[],
    playerId: string | null,
  ): void {
    const legends: EntitySnapshot[] = [];
    for (const entity of entities) {
      const { transform, health } = entity;
      const isUnit = entity.family === 'mob' || entity.family === 'legend';
      if (!isUnit || transform === null || entity.id === playerId) continue;
      if (health !== null && health.current <= 0) continue;
      if (Math.hypot(transform.x - center.x, transform.y - center.y) > MINI_MAP_VIEW_RADIUS) {
        continue;
      }
      if (entity.family === 'legend') {
        legends.push(entity);
      } else {
        MiniMapView.drawDot(renderer, entity, MINI_MAP_MOB_GLYPH);
      }
    }
    for (const legend of legends) MiniMapView.drawDot(renderer, legend, MINI_MAP_LEGEND_GLYPH);
  }

  private static drawDot(
    renderer: Renderer,
    entity: EntitySnapshot,
    glyph: typeof MINI_MAP_MOB_GLYPH | typeof MINI_MAP_LEGEND_GLYPH,
  ): void {
    const { team, transform } = entity;
    if (transform === null) return;
    const color = team === null || team === 'neutral' ? NEUTRAL_ENTITY_COLOR : TEAM_COLORS[team];
    renderer.drawGlyph(glyph, { x: transform.x, y: transform.y }, color);
  }

  /** The square of world units, side `2 · MINI_MAP_VIEW_RADIUS`, around `center`. */
  private static worldViewAround(center: WorldPoint): WorldRect {
    const side = MINI_MAP_VIEW_RADIUS * 2;
    return {
      x: center.x - MINI_MAP_VIEW_RADIUS,
      y: center.y - MINI_MAP_VIEW_RADIUS,
      width: side,
      height: side,
    };
  }

  /** Device pixels per design pixel: the ring scales with the smaller screen dimension. */
  private scaleFor(screenWidth: number, screenHeight: number): number {
    const { frame } = this.ring;
    return Math.min(screenWidth / frame.width, screenHeight / frame.height);
  }
}
