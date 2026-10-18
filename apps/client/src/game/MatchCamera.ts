import type { CathedralInterior, MapDefinition } from '@eternalus/core';

import type { Camera } from './engine/Camera';
import type { ScreenPoint } from './engine/input/InputDevice.types';
import type { Projection } from './engine/input/Projection.types';
import type { WorldPoint, WorldRect } from './engine/render/Renderer.types';
import { MapExplorer } from './MapExplorer';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';
import { CAMERA_SMOOTHING, DEFAULT_ASPECT } from './MatchCamera.constants';

/**
 * Decides which part of which world a match shows: the following `Camera`, or the free
 * `MapExplorer` view that dragging, the overview and the cathedral interior switch to until the
 * player moves. It holds the drawing size, so it is also the match's `Projection` from canvas
 * points to the world (architecture 08 §5). `Match` owns one and draws whatever it shows.
 */
export class MatchCamera implements Projection {
  private readonly explorer: MapExplorer;

  private isFollowing = true;

  /** Whether the free `MapExplorer` view is on screen instead of the camera's. */
  private isExploring = false;

  private drawWidth = 0;

  private drawHeight = 0;

  private pixelRatio = 1;

  /**
   * Starts following with `camera` on the battlefield `map`; `interior` is the cathedral's
   * explorable inside, or `null` when the map has none.
   */
  public constructor(
    private readonly camera: Camera,
    private readonly map: MapDefinition,
    interior: CathedralInterior | null,
  ) {
    this.explorer = new MapExplorer(map, interior);
  }

  /** Whether the view is inside the cathedral. */
  public get isInterior(): boolean {
    return this.explorer.isInterior;
  }

  /** The drawing area's width in device pixels (0 before the first resize). */
  public get screenWidth(): number {
    return this.drawWidth;
  }

  /** The drawing area's height in device pixels (0 before the first resize). */
  public get screenHeight(): number {
    return this.drawHeight;
  }

  /** Sets the drawing area in device pixels and how many device pixels make one CSS pixel. */
  public resize(screenWidth: number, screenHeight: number, pixelRatio: number): void {
    this.drawWidth = screenWidth;
    this.drawHeight = screenHeight;
    this.pixelRatio = pixelRatio;
  }

  /** The world point the following camera shows under a canvas point (CSS pixels). */
  public screenToWorld(point: ScreenPoint): WorldPoint {
    return this.camera.screenToWorld(
      { x: point.x * this.pixelRatio, y: point.y * this.pixelRatio },
      {
        worldWidth: this.map.width,
        worldHeight: this.map.height,
        screenWidth: this.drawWidth,
        screenHeight: this.drawHeight,
      },
    );
  }

  /** Eases the camera towards `target` (the player) while it is following. */
  public follow(target: WorldPoint | null): void {
    if (this.isFollowing && target !== null) {
      this.camera.track(target, CAMERA_SMOOTHING);
    }
  }

  /**
   * The player is moving: the camera follows again, even after a key held since before a click,
   * except inside the cathedral, which the player leaves with the leave button.
   */
  public playerMoved(): void {
    if (!this.explorer.isInterior) {
      this.isFollowing = true;
      this.isExploring = false;
    }
  }

  /** The part of the world on screen: the free view's or the camera's. */
  public visibleArea(): WorldRect {
    return this.isExploring
      ? this.explorer.areaFor(this.aspect)
      : this.camera.visibleArea(this.map.width, this.map.height);
  }

  /**
   * Moves whichever view is on screen to `target` (a minimap click; the free view also zooms in)
   * and stops following the player until they move again.
   */
  public lookAt(target: WorldPoint): void {
    if (this.isExploring) {
      this.explorer.lookAt(target);
      this.explorer.zoomBy(EXPLORER_SETTINGS.minimapZoom);
    } else {
      this.camera.lookAt(target);
    }
    this.isFollowing = false;
  }

  /** Drags the view by a screen offset (device pixels), switching to the free view. */
  public panBy(screenDx: number, screenDy: number): void {
    this.explore();
    const area = this.explorer.areaFor(this.aspect);
    this.explorer.pan(
      (-screenDx * area.width) / this.drawWidth,
      (-screenDy * area.height) / this.drawHeight,
      this.aspect,
    );
  }

  /** Zooms whichever view is on screen; `factor` above 1 zooms in. */
  public zoomBy(factor: number): void {
    if (this.isExploring) {
      this.explorer.zoomBy(factor);
    } else {
      this.camera.zoomTo(this.camera.zoom * factor);
    }
  }

  /**
   * Enters the cathedral when the screen point (device pixels) is on it.
   *
   * @returns Whether the view moved inside.
   */
  public enterAt(screenX: number, screenY: number): boolean {
    const view = this.visibleArea();
    const isEntered = this.explorer.enterAt({
      x: view.x + (screenX / this.drawWidth) * view.width,
      y: view.y + (screenY / this.drawHeight) * view.height,
    });
    if (isEntered) {
      this.isExploring = true;
      this.isFollowing = false;
    }
    return isEntered;
  }

  /** Shows the whole battlefield in the free view, leaving the cathedral if inside. */
  public overview(): void {
    this.explorer.overview();
    this.isExploring = true;
    this.isFollowing = false;
  }

  /** Leaves the cathedral interior and returns to following the player (I-55). */
  public leaveInterior(): void {
    this.explorer.overview();
    this.isExploring = false;
    this.isFollowing = true;
  }

  /** The drawing area's width over its height, until the first resize a default. */
  private get aspect(): number {
    return this.drawHeight > 0 ? this.drawWidth / this.drawHeight : DEFAULT_ASPECT;
  }

  /** Switches to the free view, starting from what the camera shows so nothing jumps. */
  private explore(): void {
    if (!this.isExploring) {
      this.explorer.showArea(this.camera.visibleArea(this.map.width, this.map.height), this.aspect);
      this.isExploring = true;
    }
    this.isFollowing = false;
  }
}
