import { describe, expect, it } from 'vitest';

import { SENTINEL } from '../legends/sentinel';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { STATUS_EFFECTS } from '../status-effects/statusEffectCatalogue';
import { KnownStatusRefsRule } from './KnownStatusRefsRule';

const rule = new KnownStatusRefsRule(STATUS_EFFECTS);

describe('KnownStatusRefsRule', () => {
  it('accepts a unit with no immunities and the Sentinel immune to Fear (DEC-207)', () => {
    expect(rule.check(MOB_DEFINITIONS.get('light-minion'))).toEqual([]);
    expect(rule.check(SENTINEL)).toEqual([]);
  });

  it('flags an immunity that names no status', () => {
    expect(rule.check({ ...SENTINEL, statusImmunities: ['feared', 'fearred'] })).toEqual([
      'statusImmunities "fearred" names no status',
    ]);
  });
});
