import type { LaneAssessmentWeights } from './ai.types';

/** The lane-assessment weights (MS-9, DEC-89; architecture 18 §3.3): equal to start. */
export const LANE_ASSESSMENT_WEIGHTS = {
  structureDamageTaken: 1 / 3, // TUNE: DEC-89
  pushedBack: 1 / 3, // TUNE: DEC-89
  alliesHurt: 1 / 3, // TUNE: DEC-89
} as const satisfies LaneAssessmentWeights;
