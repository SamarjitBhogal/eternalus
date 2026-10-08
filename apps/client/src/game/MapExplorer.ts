import type { MapDefinition, Vec2 } from '@eternalus/core';
import type { WorldRect } from './engine/Renderer.types';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';

/** Owns presentation-only camera navigation and cathedral entry for the map preview. */
export class MapExplorer {
  private center: Vec2;
  private zoom = 1;
  private isInside = false;

  /** Starts with an overview of the original three-lane battlefield. */
  public constructor(private readonly map: MapDefinition) {
    this.center = { x: map.width / 2, y: map.height / 2 };
  }

  /** The immutable map currently being explored. */
  public get currentMap(): MapDefinition {
    return this.isInside ? (this.map.interior ?? this.map) : this.map;
  }

  /** Whether the preview is showing the cathedral interior. */
  public get isInterior(): boolean {
    return this.isInside;
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

  /** Moves the preview camera; clamping is applied when its visible area is requested. */
  public lookAt(point: Vec2): void {
    this.center = point;
  }

  /** Pans by a world-space offset from the visible centre. */
  public pan(dx: number, dy: number, aspect: number): void {
    const area = this.areaFor(aspect);
    this.center = { x: area.x + area.width / 2 + dx, y: area.y + area.height / 2 + dy };
  }

  /** Zooms within a bounded range so a large battlefield can be explored in detail. */
  public zoomBy(factor: number): void {
    this.zoom = Math.max(1, Math.min(EXPLORER_SETTINGS.maxZoom, this.zoom * factor));
  }

  /** Enters only when the selected world point falls inside the cathedral footprint. */
  public enterAt(point: Vec2): boolean {
    const cathedral = this.map.features.find((feature) => feature.kind === 'cathedral');
    const halfSize = EXPLORER_SETTINGS.cathedralHalfSize * (this.map.presentationScale ?? 1);
    const halfWidth = this.map.interiorEntry?.halfWidth ?? halfSize;
    const halfHeight = this.map.interiorEntry?.halfHeight ?? halfSize;
    if (
      this.isInside ||
      this.map.interior === undefined ||
      cathedral === undefined ||
      Math.abs(point.x - cathedral.position.x) > halfWidth ||
      Math.abs(point.y - cathedral.position.y) > halfHeight
    )
      return false;
    this.isInside = true;
    this.zoom = EXPLORER_SETTINGS.interiorZoom;
    this.center = { x: this.currentMap.width / 2, y: this.currentMap.height / 2 };
    return true;
  }

  /** Leaves the cathedral and restores the battlefield overview. */
  public overview(): void {
    this.isInside = false;
    this.zoom = 1;
    this.center = { x: this.map.width / 2, y: this.map.height / 2 };
  }
}
