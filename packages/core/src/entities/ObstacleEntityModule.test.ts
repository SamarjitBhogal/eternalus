import { describe, expect, it } from 'vitest';

import { EntityRegistry } from './EntityRegistry';
import { Obstacle } from './Obstacle';
import { ObstacleEntityModule } from './ObstacleEntityModule';

describe('ObstacleEntityModule', () => {
  it('registers the one Obstacle class', () => {
    const registry = new EntityRegistry();

    new ObstacleEntityModule().register(registry);

    expect(registry.get('obstacle')).toBe(Obstacle);
  });
});
