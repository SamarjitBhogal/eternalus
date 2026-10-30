import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { LEVEL_CURVE_CATALOGUE } from './levelCurveCatalogue';
import type { LevelCurveDefinition } from './progression.types';

/** What is wrong with `curve`, or nothing. A short table would let a Legend jump to the cap for free. */
const problemsOf = (curve: LevelCurveDefinition): string[] => {
  const problems: string[] = [];
  if (!Number.isInteger(curve.cap) || curve.cap < 1) {
    problems.push('cap must be a whole number of at least 1');
  } else if (curve.xpToNext.length !== curve.cap - 1) {
    problems.push('xpToNext needs cap - 1 steps');
  }
  if (curve.xpToNext.some((step) => !(step > 0 && Number.isFinite(step)))) {
    problems.push('steps must be positive');
  }
  return problems.map((problem) => `Level curve "${curve.id}": ${problem}.`);
};

/**
 * Loads the level curves, validated once at load (04 §5, DEC-22).
 *
 * @param authored - The curves to load; the shipped set by default.
 * @throws ContentValidationError listing every broken rule.
 */
export const loadLevelCurves = (
  authored: readonly LevelCurveDefinition[] = LEVEL_CURVE_CATALOGUE.all(),
): ContentCatalogue<LevelCurveDefinition> => {
  const problems = authored.flatMap(problemsOf);
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
  return new ContentCatalogue(authored);
};
