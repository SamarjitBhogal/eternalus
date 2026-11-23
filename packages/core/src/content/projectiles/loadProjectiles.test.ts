import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadProjectiles } from './loadProjectiles';
import type { ProjectileDefinition } from './projectiles.types';

const TEST_SHOT: ProjectileDefinition = {
  id: 'test-shot',
  kind: 'projectile',
  displayName: 'Test shot',
  footprintRadius: 0.2,
  movementProfile: { maxSpeed: 60, acceleration: 1, mass: 0.1 },
  range: 500,
  slowFrom: 400,
  endDuration: 0.5,
};

describe('loadProjectiles', () => {
  it('converts the speed to metres per tick and sets acceleration to it, so a shot is at full speed in tick 1', () => {
    const { movementProfile, range, slowFrom, endDuration } = loadProjectiles(30, [TEST_SHOT]).get(
      'test-shot',
    );

    expect(movementProfile.maxSpeed).toBe(2);
    expect(movementProfile.acceleration).toBe(2);
    expect(range).toBe(500);
    expect(slowFrom).toBe(400);
    expect(endDuration).toBe(15);
  });

  it('rejects an arc shot that slows before its range (createProjectileRules)', () => {
    const broken = () => loadProjectiles(30, [{ ...TEST_SHOT, isArc: true }]);

    expect(broken).toThrow(ContentValidationError);
    expect(broken).toThrow('Projectile "test-shot": an arc shot needs slowFrom equal to range.');
    expect(() => loadProjectiles(30, [{ ...TEST_SHOT, isArc: true, slowFrom: 500 }])).not.toThrow();
  });

  it('keeps an end duration of at least one tick', () => {
    expect(
      loadProjectiles(30, [{ ...TEST_SHOT, endDuration: 0.001 }]).get('test-shot').endDuration,
    ).toBe(1);
  });

  it('ships the bolt, the arrow, the two turret bolts and the tower orb', () => {
    expect(loadProjectiles(30).ids).toEqual([
      'magus-bolt',
      'arrow',
      'turret-bolt',
      'turret-heavy-bolt',
      'tower-orb',
    ]);
  });

  it('loads the turret bolts at balancing.md speeds: 30 m/s default, 24 m/s heavy', () => {
    const projectiles = loadProjectiles(30);

    expect(projectiles.get('turret-bolt').movementProfile.maxSpeed).toBe(1);
    expect(projectiles.get('turret-heavy-bolt').movementProfile.maxSpeed).toBe(0.8);
  });

  it.each([
    ['id', { id: 'Test_Shot' }, 'id must be kebab-case'],
    ['radius', { footprintRadius: 0 }, 'footprintRadius must be positive'],
    ['range', { range: 0 }, 'range must be positive'],
    ['slowFrom of zero', { slowFrom: 0 }, 'slowFrom must be above 0 and at most range'],
    ['slowFrom past the range', { slowFrom: 501 }, 'slowFrom must be above 0 and at most range'],
    ['end duration', { endDuration: 0 }, 'endDuration must be positive'],
    [
      'range under one tick of flight',
      { range: 1.5, slowFrom: 1 },
      'range must be at least one tick of flight',
    ],
    [
      'speed',
      { movementProfile: { ...TEST_SHOT.movementProfile, maxSpeed: 0 } },
      'maxSpeed must be positive',
    ],
  ])('rejects a bad %s', (_, change, message) => {
    expect(() => loadProjectiles(30, [{ ...TEST_SHOT, ...change }])).toThrow(
      ContentValidationError,
    );
    expect(() => loadProjectiles(30, [{ ...TEST_SHOT, ...change }])).toThrow(message);
  });
});
