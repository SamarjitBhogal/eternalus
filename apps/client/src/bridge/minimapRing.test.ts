import { describe, expect, it } from 'vitest';

import { MINI_MAP_DESIGN_FRAME, MINI_MAP_RING, MINI_MAP_RING_STROKE } from './minimapRing';

describe('minimapRing', () => {
  it('places the ring where Figma 65:743 draws it in the 1920 × 1080 frame (1636, 47)', () => {
    expect(MINI_MAP_DESIGN_FRAME).toEqual({ width: 1920, height: 1080 });
    expect(MINI_MAP_DESIGN_FRAME.width - MINI_MAP_RING.right - MINI_MAP_RING.width).toBe(1636);
    expect(MINI_MAP_RING.top).toBe(47);
    expect(MINI_MAP_RING.top + MINI_MAP_RING.height).toBeLessThan(MINI_MAP_DESIGN_FRAME.height);
  });

  it('leaves room for the map inside the stroke', () => {
    expect(MINI_MAP_RING_STROKE * 2).toBeLessThan(
      Math.min(MINI_MAP_RING.width, MINI_MAP_RING.height),
    );
  });
});
