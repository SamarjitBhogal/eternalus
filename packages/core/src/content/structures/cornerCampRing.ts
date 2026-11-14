import { STRUCTURE_DEFINITIONS } from './structureCatalogue';

/** The camp's own circle: the leash and the boss's post are measured from its edge. */
const CAMP_FOOTPRINT = STRUCTURE_DEFINITIONS.get('corner-camp').footprintRadius;
// TUNE: no reference value; the 45 m ring the client has drawn around a corner camp since DEC-236.
const RADIUS = 22.5;
const POST_GAP = 2; // TUNE: as the forest camps' (guardPlans.ts): just outside the camp
/** From the camp's centre to the boss's post. */
const POST_REACH = CAMP_FOOTPRINT + POST_GAP;

/**
 * The corner camp's ring (game doc "Outer (Corner) Camps"), the one source for the circle the
 * client draws, the camp's guard plan and its boss's aggro rule and vision. In metres.
 */
export const CORNER_CAMP_RING = {
  /** The ring the client draws: the boss's ground. */
  radius: RADIUS,
  /** The ring less the camp's footprint: the boss never chases out of the ring. */
  leashRadius: RADIUS - CAMP_FOOTPRINT,
  postGap: POST_GAP,
  /** From the boss's post, as far as the ring's far side: it sees an enemy anywhere inside. */
  acquisitionRadius: RADIUS + POST_REACH,
} as const;
