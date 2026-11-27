import type { MapObject } from '../content/maps/mapObjects.types';
import { boundsOf } from '../utils/geometry';
import type { Polygon, Rect } from '../utils/geometry.types';
import type { Outline } from './Outline.types';

/** Connects an existing Obstacle entity to its authored world geometry and destruction art. */
export class MapObjectBody implements Outline {
  /** The box around every footprint: a cheap first test before the exact polygons. */
  public readonly bounds: Rect;

  /** Keeps exact polygons instead of treating a building's whole bounding circle as solid. */
  public constructor(public readonly object: MapObject) {
    this.bounds = boundsOf(object.footprints.flat());
  }

  /** The object's footprints: its outline. */
  public get polygons(): readonly Polygon[] {
    return this.object.footprints;
  }

  /**
   * Whether units walk on the outline (the object does not block: a palace floor, a gate's
   * passage), as `Footprint.isWalkOn`.
   */
  public get isWalkOn(): boolean {
    return !this.object.isBlocking;
  }
}
