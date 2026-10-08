import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import { Obstacle } from './Obstacle';

const TREE: ObstacleDefinition = {
  id: 'fake-tree',
  kind: 'obstacle',
  obstacleType: 'tree',
  displayName: 'Fake Tree',
  footprintRadius: 0.6,
  health: 400,
  isBurnable: true,
  weight: 8,
};

const ROCK: ObstacleDefinition = { ...TREE, id: 'fake-rock', obstacleType: 'rock', health: null };

describe('Obstacle', () => {
  it('is one concrete class for every obstacle type', () => {
    const tree = new Obstacle('entity-1', 'fake-tree');

    expect(tree.kind).toBe('obstacle');
    expect(tree.family).toBe('obstacle');
  });

  it('installs a static obstacle collider and no team', () => {
    const tree = new Obstacle('entity-1', 'fake-tree');

    tree.spawn({ definition: TREE, position: { x: 5, y: 5 } });

    expect(tree.get(Transform).position).toEqual({ x: 5, y: 5 });
    expect(tree.get(Collider).layer).toBe('obstacle');
    expect(tree.get(Collider).isStatic).toBe(true);
    expect(tree.has(TeamMembership)).toBe(false);
  });

  it('gets health only when it can break', () => {
    const tree = new Obstacle('entity-1', 'fake-tree');
    const rock = new Obstacle('entity-2', 'fake-rock');

    tree.spawn({ definition: TREE, position: { x: 0, y: 0 } });
    rock.spawn({ definition: ROCK, position: { x: 0, y: 0 } });

    expect(tree.get(Health).base).toBe(400);
    expect(rock.has(Health)).toBe(false);
  });
});
