import type { MapObject } from '../content/maps/mapObjects.types';

/** Connects an existing Obstacle entity to its authored world geometry and destruction art. */
export class MapObjectBody {
  /** Keeps exact polygons instead of treating a building's whole bounding circle as solid. */
  public constructor(public readonly object: MapObject) {}
}
