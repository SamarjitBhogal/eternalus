import { describe, expect, it } from 'vitest';

import { Entity } from '../entities/Entity';
import { WinObjective } from './WinObjective';

class Banner extends Entity {
  public readonly kind = 'banner';
  public readonly family = 'test';

  protected installComponents(): void {
    // Tests add the components they need.
  }
}

describe('WinObjective', () => {
  it('tags the entity that carries it, and only that one', () => {
    const objective = new Banner('entity-1', 'banner');
    const other = new Banner('entity-2', 'banner');

    objective.addComponent(new WinObjective());

    expect(objective.hasComponent(WinObjective)).toBe(true);
    expect(other.hasComponent(WinObjective)).toBe(false);
  });

  it('carries no state, so the state hash has nothing to add for it', () => {
    expect(Object.keys(new WinObjective())).toEqual([]);
  });
});
