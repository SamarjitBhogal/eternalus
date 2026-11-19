import { describe, expect, it } from 'vitest';

import { Transform } from '../../components/Transform';
import { casterState } from '../__fixtures__/casterState';
import type { CastTargeting } from './CastTargeting.types';
import { HeadingTargeting } from './HeadingTargeting';

const HEADING = { kind: 'heading' } as const;
/** Sent by the client; the cast ignores it. */
const SENT = { point: { x: -7, y: 3 }, targetId: 'entity-9' };

/** The `casterState` Warrior moved to (10, 20), facing east. */
const setUp = () => {
  const { state, caster } = casterState();
  const transform = caster.getComponent(Transform);
  transform.moveTo({ x: 10, y: 20 });
  transform.face({ x: 1, y: 0 });
  const targeting: CastTargeting = new HeadingTargeting();
  return { state, caster, targeting };
};

describe('HeadingTargeting', () => {
  it('aims one metre the way the caster moves, whatever aim was sent', () => {
    const { state, caster, targeting } = setUp();
    state.entities.steer(caster.id, { x: 0, y: 4 });

    expect(targeting.aimFor(HEADING, SENT, caster.id, state)).toEqual({
      point: { x: 10, y: 21 },
      targetId: null,
    });
  });

  it('aims one metre the way the caster faces when it does not move', () => {
    const { state, caster, targeting } = setUp();
    state.entities.steer(caster.id, { x: 0, y: 0 });

    expect(targeting.aimFor(HEADING, SENT, caster.id, state)).toEqual({
      point: { x: 11, y: 20 },
      targetId: null,
    });
  });

  it('takes any aim, the caster’s own point included: it is ignored', () => {
    const { state, caster, targeting } = setUp();
    const onCaster = { point: { x: 10, y: 20 }, targetId: null };

    expect(targeting.aimBlockedBy(HEADING, onCaster, caster.id, state)).toBeNull();
    expect(targeting.aimBlockedBy(HEADING, SENT, caster.id, state)).toBeNull();
  });

  it('fails loudly when the caster is not in the match', () => {
    const { state, targeting } = setUp();

    expect(() => targeting.aimFor(HEADING, SENT, 'entity-404', state)).toThrow(
      'no entity "entity-404"',
    );
  });
});
