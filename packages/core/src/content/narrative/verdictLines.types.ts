import type { VictoryConditionId } from '../../config/VictoryConditionId.types';

/**
 * The line under the verdict for each way one side sees the end of a match. `{name}` stands for
 * the display name of the fallen side's objective (architecture 12 §8's placeholder convention).
 */
export type VerdictLineSet = {
  readonly victory: string;
  readonly defeat: string;
  readonly draw: string;
};

/**
 * Why the match ended, one line set per victory condition (architecture 12 §9: the results screen
 * closes with `verdictLines[condition]`). A condition joins with its lines; one without lines shows
 * none.
 */
export type VerdictLines = Readonly<Partial<Record<VictoryConditionId, VerdictLineSet>>>;
