import type { LaneAssessmentWeights } from './ai.types';

/** The lane-assessment weights (MS-9, open for the owner's sign-off; architecture 18 §3.3). */
export const LANE_ASSESSMENT_WEIGHTS = {
  damageNotDealt: 1 / 3, // TUNE: Recommendation in architecture 18 §3.3
  structuresLost: 1 / 3, // TUNE: Recommendation in architecture 18 §3.3
  pushedBack: 1 / 3, // TUNE: Recommendation in architecture 18 §3.3
} as const satisfies LaneAssessmentWeights;
