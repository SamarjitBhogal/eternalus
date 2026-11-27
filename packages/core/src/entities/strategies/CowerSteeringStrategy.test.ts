import { describe, expect, it } from 'vitest';

import { CowerSteeringStrategy } from './CowerSteeringStrategy';

describe('CowerSteeringStrategy', () => {
  it('sets the heading to zero, wherever the source stands or when it is gone', () => {
    const steering = new CowerSteeringStrategy();
    const heading = { x: -0.6, y: 0.8 };

    steering.steer({ x: 3, y: 4 }, { x: 0, y: 0 }, heading);
    expect(heading).toEqual({ x: 0, y: 0 });

    heading.x = 1;
    steering.steer({ x: 3, y: 4 }, undefined, heading);
    expect(heading).toEqual({ x: 0, y: 0 });
  });
});
