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
   * Its footprints when units walk on them (the object does not block: a palace floor, a gate's
   * passage); none for a blocking object.
   */
  public get walkOn(): readonly Polygon[] {
    return this.object.isBlocking ? [] : this.object.footprints;
  }

  /** Its footprints when the object blocks (a rock, a wall); none for a walk-on object. */
  public get solid(): readonly Polygon[] {
    return this.object.isBlocking ? this.object.footprints : [];
  }

  /**
   * Its solid footprints when shots cross them (`MapObject.canShotsCross`: a camp fire, HC-Q105),
   * so a shot not aimed at the object flies over it (`Outline.shotsCross`); none otherwise.
   */
  public get shotsCross(): readonly Polygon[] {
    return this.object.canShotsCross === true ? this.solid : [];
  }
}
