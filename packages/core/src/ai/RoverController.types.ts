import type { LaneAssessmentWeights, RoverTactics } from '../content/ai/ai.types';
import type { BotLegendControllerContent } from './BotLegendController.types';

/** What `RoverController` reads besides the state, injected so it holds no content. */
export type RoverControllerContent = BotLegendControllerContent & {
  /** How it senses, hunts and mirrors the human. */
  readonly tactics: RoverTactics;
  /** The Legend kinds, so the human search asks `Perception` for Legends only. */
  readonly legendKinds: readonly string[];
  /** The weights of the lane assessment that names the lane to defend (18 §3.3). */
  readonly laneWeights: LaneAssessmentWeights;
};
