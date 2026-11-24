import { describe, expect, it } from 'vitest';

import { FleeSourceSteeringStrategy } from './FleeSourceSteeringStrategy';

describe('FleeSourceSteeringStrategy', () => {
  it('points straight away from the source', () => {
    const heading = { x: 0, y: 0 };

    new FleeSourceSteeringStrategy().steer({ x: 3, y: 4 }, { x: 0, y: 0 }, heading);

    expect(heading).toEqual({ x: 0.6, y: 0.8 });
  });

  it('keeps the last heading once the source is gone, or while it stands on the source', () => {
    const heading = { x: -1, y: 0 };
    const steering = new FleeSourceSteeringStrategy();

    steering.steer({ x: 3, y: 4 }, undefined, heading);
    expect(heading).toEqual({ x: -1, y: 0 });
    steering.steer({ x: 3, y: 4 }, { x: 3, y: 4 }, heading);
    expect(heading).toEqual({ x: -1, y: 0 });
  });
});
