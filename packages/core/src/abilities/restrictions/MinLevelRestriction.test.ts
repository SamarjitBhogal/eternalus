import { describe, expect, it } from 'vitest';

import { Progression } from '../../components/Progression';
import { loadLevelCurves } from '../../content/progression/loadLevelCurves';
import { casterState } from '../__fixtures__/casterState';
import { MinLevelRestriction } from './MinLevelRestriction';

const LEVEL_2 = { kind: 'min-level', level: 2 } as const;

describe('MinLevelRestriction', () => {
  it('restricts a caster below the level and lets one at it cast', () => {
    const { state, caster } = casterState();
    const rule = new MinLevelRestriction();
    expect(rule.check(LEVEL_2, caster.id, state)).toBe('restricted');

    const progression = caster.getComponent(Progression);
    const curve = loadLevelCurves().get(progression.curveId);
    progression.addXp(curve.xpToNext[0] ?? 0, curve);

    expect(progression.level).toBe(2);
    expect(rule.check(LEVEL_2, caster.id, state)).toBeNull();
  });

  it('treats a caster without Progression as level 1', () => {
    const { state, factory } = casterState();
    const dummy = factory.create('light-mob', 'training-dummy', {
      position: { x: 1, y: 1 },
      team: 'dark',
    });
    state.entities.add(dummy);
    const rule = new MinLevelRestriction();

    expect(rule.check({ kind: 'min-level', level: 1 }, dummy.id, state)).toBeNull();
    expect(rule.check(LEVEL_2, dummy.id, state)).toBe('restricted');
  });
});
