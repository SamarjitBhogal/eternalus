import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Movement } from '../components/Movement';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import { Projectile } from './Projectile';

const BOLT: ProjectileDefinition = {
  id: 'fake-bolt',
  kind: 'projectile',
  displayName: 'Fake Bolt',
  footprintRadius: 0.15,
  movementProfile: { maxSpeed: 2, acceleration: 2, mass: 0.05 },
  range: 100,
  slowFrom: 80,
  endDuration: 2,
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

    expect(bolt.getComponent(Transform).radius).toBe(0.15);
    expect(bolt.getComponent(Movement).maxSpeed).toBe(2);
    expect(bolt.getComponent(Collider).layer).toBe('projectile');
    expect(bolt.getComponent(Collider).isStatic).toBe(false);
    expect(bolt.getComponent(TeamMembership).team).toBe('dark');
  });

  it('installs its flight from the definition: range, where it slows, how long it ends', () => {
    const bolt = new Projectile('entity-1', 'fake-bolt');

    bolt.spawn({ definition: BOLT, position: { x: 0, y: 0 }, team: 'light' });

    const flight = bolt.getComponent(ProjectileFlight);
    expect(flight.range).toBe(100);
    expect(flight.slowFrom).toBe(80);
    flight.end();
    expect(flight.endTicksLeft).toBe(2);
  });

  it('reaches full speed on its first tick when acceleration equals top speed', () => {
    const bolt = new Projectile('entity-1', 'fake-bolt');
    bolt.spawn({ definition: BOLT, position: { x: 0, y: 0 }, team: 'light' });

    bolt.getComponent(Movement).accelerateToward({ x: 1, y: 0 });

    expect(bolt.getComponent(Movement).speed).toBe(2);
  });
});
