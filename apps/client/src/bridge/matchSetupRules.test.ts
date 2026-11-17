import { describe, expect, it } from 'vitest';

import { canRepeatSetup } from './matchSetupRules';

describe('matchSetupRules', () => {
  it.each([
    ['local', true],
    ['duel', false],
    [null, false],
  ] as const)('canRepeatSetup(%s) is %s', (mode, expected) => {
    expect(canRepeatSetup(mode)).toBe(expected);
  });
});
