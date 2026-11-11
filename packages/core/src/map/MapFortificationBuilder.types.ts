import type { Rect } from '../utils/geometry.types';

/** One fort wall piece for `MapFortificationBuilder`: its id, box and colours. */
export type FortWall = {
  readonly id: string;
  readonly box: Rect;
  readonly color: string;
  /** A corner tower's roof colour; the roof belongs to the piece's object. */
  readonly roof?: string;
  /** The lane tower whose body the piece is (DEC-217 (12)); absent on a capture point's fort. */
  readonly partOf?: string;
};
