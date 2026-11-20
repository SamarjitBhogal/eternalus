import { BUILDING_GEOMETRY } from '../maps/buildingGeometry';

const { capturePointSize, wallDivisor, keepWidthDivisor, keepHeightDivisor } =
  BUILDING_GEOMETRY.fort;
/** Half the court's side inside the fort's walls. */
const COURT_HALF = (capturePointSize - (2 * capturePointSize) / wallDivisor) / 2;
/** From the fort's centre to a corner of its keep. */
const KEEP_REACH = Math.hypot(
  capturePointSize / keepWidthDivisor / 2,
  capturePointSize / keepHeightDivisor / 2,
);

// TUNE: no reference value; posts stand midway between the keep's corners and the court's walls,
// clear of both.
const POST_GAP = (KEEP_REACH + COURT_HALF) / 2;

/**
 * The outer capture point's court, derived from the fort (`buildingGeometry.ts`, the one source),
 * for the zone's guard plan and its boss's aggro rule. Fort geometry is in sketch units, which are
 * metres on the default 1600 × 900 world (`map/zoneArea.ts` stretches it on another size; the
 * guard plan does not).
 */
export const CAPTURE_POINT_COURT = {
  /** The court's inscribed circle: a zone guard never chases out of the court. */
  leashRadius: COURT_HALF,
  postGap: POST_GAP,
  /** From a post, as far as the court's far side: post gap plus leash. */
  acquisitionRadius: POST_GAP + COURT_HALF,
} as const;
