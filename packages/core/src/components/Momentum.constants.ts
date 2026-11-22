import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';

/**
 * The shortest loss (metres) that `Momentum.shed` counts as a wall. The resolver backs a unit off
 * a wall by up to `CONTACT_EPSILON`, so a smaller loss is that back-off, not a block. A unit that
 * presses into a wall it slides along (`Momentum.drive`) loses about acceleration × sin(angle) per
 * tick, which is above this from about 0.2° into the wall; below that, the plain turn rule does not
 * lose speed along the wall either. Numerical, not a gameplay distance.
 */
export const BLOCK_EPSILON = 100 * CONTACT_EPSILON;
