import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import { Projectile } from './Projectile';

const BOLT: ProjectileDefinition = {
  id: 'fake-bolt',
  kind: 'projectile',
  displayName: 'Fake Bolt',
  footprintRadius: 0.15,
  movement: { maxSpeed: 2, acceleration: 2, mass: 0.05 },
};

describe('Projectile', () => {
  it('is a concrete projectile', () => {
    const bolt = new Projectile('entity-1', 'fake-bolt');

    expect(bolt.kind).toBe('projectile');
    expect(bolt.family).toBe('projectile');
  });

  it('installs movement, a projectile collider and the team that fired it', () => {
    const bolt = new Projectile('entity-1', 'fake-bolt');

    bolt.spawn({ definition: BOLT, position: { x: 1, y: 1 }, team: 'dark' });

    expect(bolt.get(Transform).radius).toBe(0.15);
    expect(bolt.get(Movement).maxSpeed).toBe(2);
    expect(bolt.get(Collider).layer).toBe('projectile');
    expect(bolt.get(Collider).isStatic).toBe(false);
    expect(bolt.get(TeamMembership).team).toBe('dark');
  });

  it('reaches full speed on its first tick when acceleration equals top speed', () => {
    const bolt = new Projectile('entity-1', 'fake-bolt');
    bolt.spawn({ definition: BOLT, position: { x: 0, y: 0 }, team: 'light' });

    bolt.get(Movement).accelerateToward({ x: 1, y: 0 });

    expect(bolt.get(Movement).speed).toBe(2);
  });
});
