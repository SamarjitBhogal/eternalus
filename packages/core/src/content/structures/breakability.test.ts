import { describe, expect, it } from 'vitest';

import { BREAKABILITY_EVALUATORS, isBreakableUnder } from './breakability';
import type { BreakabilityRule } from './breakability.types';

describe('breakability registry', () => {
  it('has an evaluator for every rule kind', () => {
    expect(Object.keys(BREAKABILITY_EVALUATORS).sort()).toEqual([
      'allied-buff-towers-down',
      'always',
      'never',
    ]);
  });

  it.each([
    [{ kind: 'always' }, 0, 3, true],
    [{ kind: 'never' }, 3, 3, false],
    [{ kind: 'allied-buff-towers-down', fraction: 2 / 3 }, 1, 3, false],
    [{ kind: 'allied-buff-towers-down', fraction: 2 / 3 }, 2, 3, true],
    [{ kind: 'allied-buff-towers-down', fraction: 2 / 3 }, 3, 5, false],
    [{ kind: 'allied-buff-towers-down', fraction: 2 / 3 }, 4, 5, true],
  ] as const satisfies readonly (readonly [BreakabilityRule, number, number, boolean])[])(
    'judges %o with %i of %i lost as breakable: %s',
    (rule, lost, total, expected) => {
      expect(isBreakableUnder(rule, { lost, total })).toBe(expected);
    },
  );
});
