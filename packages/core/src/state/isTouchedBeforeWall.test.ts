import { describe, expect, it } from 'vitest';

import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';
import { isTouchedBeforeWall } from './isTouchedBeforeWall';

describe('isTouchedBeforeWall', () => {
  it('counts a body touched before the wall, or with no wall on the way', () => {
    expect(isTouchedBeforeWall(4, 5)).toBe(true);
    expect(isTouchedBeforeWall(400, Number.POSITIVE_INFINITY)).toBe(true);
  });

  it('counts a body touched just past where reach stops: one whose outline is the wall', () => {
    // reach stops CONTACT_EPSILON short of the wall: the wall's own outline lies that far past it.
    expect(isTouchedBeforeWall(5 + CONTACT_EPSILON, 5)).toBe(true);
    expect(isTouchedBeforeWall(5 + 1.9 * CONTACT_EPSILON, 5)).toBe(true);
  });

  it('does not count a body behind the wall', () => {
    expect(isTouchedBeforeWall(5 + 3 * CONTACT_EPSILON, 5)).toBe(false);
    expect(isTouchedBeforeWall(5.5, 5)).toBe(false);
  });
});
