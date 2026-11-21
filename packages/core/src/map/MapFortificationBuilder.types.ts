import type { FortWallRole } from '../content/maps/mapObjects.types';
import type { Rect } from '../utils/geometry.types';

/** One fort wall piece for `MapFortificationBuilder`: its id, box and colours. */
export type FortWall = {
  readonly id: string;
  /** Which piece of the fort this is; set on a lane tower's walls (with `partOf`). */
  readonly role: FortWallRole;
  readonly box: Rect;
  readonly color: string;
  /** A corner tower's roof colour; the roof belongs to the piece's object. */
  readonly roof?: string;
  /** The lane tower whose body the piece is (DEC-217 (12)); absent on a capture point's fort. */
  readonly partOf?: string;
};
