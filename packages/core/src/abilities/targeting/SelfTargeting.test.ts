import { describe, expect, it } from 'vitest';

import { casterState } from '../__fixtures__/casterState';
import type { CastTargeting } from './CastTargeting.types';
import { SelfTargeting } from './SelfTargeting';

const SELF = { kind: 'self' } as const;

describe('SelfTargeting', () => {
  it('takes any aim, the caster’s own point included, and runs the cast with it as sent', () => {
    const { state, caster } = casterState();
    const targeting: CastTargeting = new SelfTargeting();
    const onCaster = { point: { x: 0, y: 0 }, targetId: null };
    const east = { point: { x: 5, y: 0 }, targetId: 'entity-9' };

    expect(targeting.aimBlockedBy(SELF, onCaster, caster.id, state)).toBeNull();
    expect(targeting.aimFor(SELF, onCaster, caster.id, state)).toBe(onCaster);
    expect(targeting.aimFor(SELF, east, caster.id, state)).toBe(east);
  });
});
