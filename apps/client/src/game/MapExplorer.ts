import type { MapDefinition, Vec2 } from '@eternalus/core';

import type { WorldRect } from './engine/render/Renderer.types';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';

/**
 * Owns the free, presentation-only view of the map (the developer explorer): aspect-correct pan
 * and zoom over the whole battlefield. It never changes map data; roof cutaways are
 * `BuildingRoofs`'.
 */
export class MapExplorer {
  private center: Vec2;
  private zoom = 1;

  /** Starts with an overview of the generated battlefield. */
  public constructor(private readonly map: MapDefinition) {
    this.center = { x: map.width / 2, y: map.height / 2 };
  }

  /** The unchanged battlefield being explored. */
  public get currentMap(): MapDefinition {
    return this.map;
  }

  /** Keeps the world's proportions intact at every window size and zoom level. */
  public areaFor(aspect: number): WorldRect {
    const map = this.currentMap;
    const width = Math.max(map.width, map.height * aspect) / this.zoom;
    const height = width / aspect;
    const x =
      width >= map.width
        ? (map.width - width) / 2
        : Math.max(0, Math.min(this.center.x - width / 2, map.width - width));
    const y =
      height >= map.height
        ? (map.height - height) / 2
        : Math.max(0, Math.min(this.center.y - height / 2, map.height - height));
    return { x, y, width, height };
  }

  /** Takes over from another view (the following camera) without jumping. */
  public showArea(area: WorldRect, aspect: number): void {
    const map = this.currentMap;
    this.center = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
    this.zoom = 1;
    this.zoomBy(Math.max(map.width, map.height * aspect) / area.width);
  }

  /** Moves the view; clamping is applied when its visible area is requested. */
  public lookAt(point: Vec2): void {
    this.center = point;
  }

  /** Pans by a world-space offset from the visible centre. */
  public pan(dx: number, dy: number, aspect: number): void {
    const area = this.areaFor(aspect);
    this.center = { x: area.x + area.width / 2 + dx, y: area.y + area.height / 2 + dy };
  }

  /** Zooms within a bounded range so the battlefield can be explored in detail. */
  public zoomBy(factor: number): void {
    this.zoom = Math.max(1, Math.min(EXPLORER_SETTINGS.maxZoom, this.zoom * factor));
  }

  /** Shows the whole battlefield again. */
  public overview(): void {
    this.zoom = 1;
    this.center = { x: this.map.width / 2, y: this.map.height / 2 };
  }
}
