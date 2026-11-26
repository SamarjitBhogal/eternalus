import { describe, expect, it } from 'vitest';

import { abilityMatch } from '../__fixtures__/abilityMatch';

/**
 * An ability that hits the Cathedral gem strikes its caster, as a weapon hit does (DEC-292:
 * "projectiles and abilities also apply"; DEC-346). The gem is a neutral, never-breakable
 * structure, so an enemy area picks it, `BreakabilityStep` blocks the hit and `CathedralGemSystem`
 * lands its stun and burn on the caster. The Magus stands at (50, 50), the gem 3 m east, inside
 * Shockwave's 5 m circle.
 */
const SELF = { x: 50, y: 50 };

describe('an ability over the Cathedral gem (scenario)', () => {
  it('stuns and burns the caster, and the gem takes no damage', () => {
    const { ids, cast, run, lost, log } = abilityMatch([
      { kind: 'magus', team: 'light', at: SELF },
      { kind: 'cathedral-gem', definitionId: 'cathedral', team: 'neutral', at: { x: 53, y: 50 } },
    ]);
    const [magus, gem] = ids;

    cast(magus ?? '', 'ability-1', SELF);
    run(2);

    expect(log.filter((line) => line.startsWith('1 '))).toEqual([
      `1 cast ${magus ?? ''} shockwave`,
      `1 gem-shock on ${magus ?? ''}`,
      `1 gem-burn on ${magus ?? ''}`,
    ]);
    expect(lost(gem)).toBe(0);
  });
});
