import { describe, expect, it } from 'vitest';

import { Vision } from './Vision';

describe('Vision', () => {
  it('sees points inside its radius, including the edge, and not beyond', () => {
    const vision = new Vision(5);
    const from = { x: 1, y: 1 };

    expect(vision.canSee(from, { x: 4, y: 5 })).toBe(true);
    expect(vision.canSee(from, { x: 6, y: 1 })).toBe(true);
    expect(vision.canSee(from, { x: 6.1, y: 1 })).toBe(false);
  });

  it('starts unrevealed and stays revealed until the latest reveal tick', () => {
    const vision = new Vision(5);
    expect(vision.isRevealedAt(0)).toBe(false);
    expect(vision.revealedUntilTick).toBe(-1);

    vision.revealUntil(90);
    vision.revealUntil(30);

    expect(vision.revealedUntilTick).toBe(90);
    expect(vision.isRevealedAt(90)).toBe(true);
    expect(vision.isRevealedAt(91)).toBe(false);
  });

  it('allows a zero radius (sees only its own position) and rejects bad radii', () => {
    expect(new Vision(0).canSee({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(true);
    expect(() => new Vision(-1)).toThrow('Vision radius must be a finite number ≥ 0');
    expect(() => new Vision(Number.POSITIVE_INFINITY)).toThrow('Vision radius');
  });
});
