import type {
  BreakabilityEvaluators,
  BreakabilityRule,
  BreakabilityFacts,
} from './breakability.types';

/**
 * The breakability registry (architecture 07 §3): one evaluator per `BreakabilityRule` kind, so a
 * new kind is one entry here and not a branch in `StructureSystem`.
 */
export const BREAKABILITY_EVALUATORS: BreakabilityEvaluators = {
  always: () => true,
  never: () => false,
  'allied-buff-towers-down': ({ fraction }, { lost, total }) => lost >= Math.ceil(fraction * total),
};

/** Whether `rule` lets a structure take damage, given the defending team's BuffTower `facts`. */
export const isBreakableUnder = (rule: BreakabilityRule, facts: BreakabilityFacts): boolean =>
  // The evaluator for `rule.kind` takes exactly this kind of rule; TypeScript cannot correlate
  // the two through a computed lookup, so the call goes through the widened signature.
  (BREAKABILITY_EVALUATORS[rule.kind] as (r: BreakabilityRule, f: BreakabilityFacts) => boolean)(
    rule,
    facts,
  );
