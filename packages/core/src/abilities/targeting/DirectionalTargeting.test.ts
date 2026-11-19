import { describe, expect, it } from 'vitest';

import { casterState } from '../__fixtures__/casterState';
import type { CastTargeting } from './CastTargeting.types';
import { DirectionalTargeting } from './DirectionalTargeting';

const DIRECTIONAL = { kind: 'directional' } as const;
/** The caster of `casterState` stands at the origin. */
const aimAt = (x: number, y: number) => ({ point: { x, y }, targetId: null });

describe('DirectionalTargeting', () => {
  it('takes an aim that gives a direction from the caster', () => {
    const { state, caster } = casterState();
    const targeting: CastTargeting = new DirectionalTargeting();

    expect(targeting.aimBlockedBy(DIRECTIONAL, aimAt(5, 0), caster.id, state)).toBeNull();
    expect(targeting.aimBlockedBy(DIRECTIONAL, aimAt(0, -0.001), caster.id, state)).toBeNull();
  });

  it('refuses as no-target an aim on the caster itself, one not finite, or a caster with no place', () => {
    const { state, caster } = casterState();
    const targeting: CastTargeting = new DirectionalTargeting();

    expect(targeting.aimBlockedBy(DIRECTIONAL, aimAt(0, 0), caster.id, state)).toBe('no-target');
    expect(targeting.aimBlockedBy(DIRECTIONAL, aimAt(Number.NaN, 0), caster.id, state)).toBe(
      'no-target',
    );
    expect(
      targeting.aimBlockedBy(DIRECTIONAL, aimAt(0, Number.POSITIVE_INFINITY), caster.id, state),
    ).toBe('no-target');
    expect(targeting.aimBlockedBy(DIRECTIONAL, aimAt(5, 0), 'entity-404', state)).toBe('no-target');
  });

  it('runs the cast with the aim as sent', () => {
    const { state, caster } = casterState();
    const targeting: CastTargeting = new DirectionalTargeting();
    const aim = { point: { x: 3, y: 4 }, targetId: 'entity-9' };

    expect(targeting.aimFor(DIRECTIONAL, aim, caster.id, state)).toBe(aim);
  });
});
