import { ContentValidator } from './ContentValidator';
import { KebabCaseIdRule } from './KebabCaseIdRule';
import { PositiveStatsRule } from './PositiveStatsRule';

/** The validator with every shipped content rule. This is the one place that lists the rules. */
export class DefaultContentValidator extends ContentValidator {
  /** Creates a validator with every shipped rule. */
  public constructor() {
    super([new KebabCaseIdRule(), new PositiveStatsRule()]);
  }
}
