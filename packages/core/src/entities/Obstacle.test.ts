import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Footprint } from '../components/Footprint';
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

    expect(tree.getComponent(Transform).position).toEqual({ x: 5, y: 5 });
    expect(tree.getComponent(Collider).layer).toBe('obstacle');
    expect(tree.getComponent(Collider).isStatic).toBe(true);
    expect(tree.hasComponent(TeamMembership)).toBe(false);
  });

  it('gets health only when it can break', () => {
    const tree = new Obstacle('entity-1', 'fake-tree');
    const rock = new Obstacle('entity-2', 'fake-rock');

    tree.spawn({ definition: TREE, position: { x: 0, y: 0 } });
    rock.spawn({ definition: ROCK, position: { x: 0, y: 0 } });

    expect(tree.getComponent(Health).current).toBe(400);
    expect(rock.hasComponent(Health)).toBe(false);
  });

  it('turns to the spawn facing and places a footprint outline there, solid', () => {
    const wall = new Obstacle('entity-3', 'fake-wall');
    const square = [
      { x: -0.5, y: -2 },
      { x: 0.5, y: -2 },
      { x: 0.5, y: 2 },
      { x: -0.5, y: 2 },
    ];

    wall.spawn({
      definition: { ...ROCK, id: 'fake-wall', obstacleType: 'barrier', footprint: square },
      position: { x: 10, y: 10 },
      facing: { x: 0, y: -3 },
    });

    expect(wall.getComponent(Transform).facing).toEqual({ x: 0, y: -1 });
    expect(wall.getComponent(Footprint).isWalkOn).toBe(false);
    expect(wall.getComponent(Footprint).polygons).toEqual([
      [
        { x: 8, y: 10.5 },
        { x: 8, y: 9.5 },
        { x: 12, y: 9.5 },
        { x: 12, y: 10.5 },
      ],
    ]);
  });

  it('has no footprint without one in its definition', () => {
    const tree = new Obstacle('entity-1', 'fake-tree');

    tree.spawn({ definition: TREE, position: { x: 0, y: 0 } });

    expect(tree.hasComponent(Footprint)).toBe(false);
  });
});
