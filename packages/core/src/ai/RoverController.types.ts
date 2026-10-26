import type { LaneAssessmentWeights, RoverTactics } from '../content/ai/ai.types';
import type { UnitClassifier } from './aggroRank.types';
import type { BotLegendControllerContent } from './BotLegendController.types';

/** What `RoverController` reads besides the state, injected so it holds no content. */
export type RoverControllerContent = BotLegendControllerContent & {
  /** How it senses, hunts and mirrors the human. */
  readonly tactics: RoverTactics;
  /** Which kinds are Legends, to tell the human apart. */
  readonly classOf: UnitClassifier;
  /** The weights of the lane assessment that names the lane to defend (18 §3.3). */
  readonly laneWeights: LaneAssessmentWeights;
};
