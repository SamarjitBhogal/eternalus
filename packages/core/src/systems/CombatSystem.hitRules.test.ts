import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { Collider } from '../components/Collider';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadProjectiles } from '../content/projectiles/loadProjectiles';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { CombatSystem } from './CombatSystem';
import { createDefaultProjectileImpacts } from './defaultProjectileImpacts';
import { MovementSystem } from './MovementSystem';
import { ProjectileSystem } from './ProjectileSystem';
import type { SystemContext } from './System.types';
import { AreaHitQuery } from '../state/AreaHitQuery';
import { ReachQuery } from '../state/ReachQuery';

const CONFIG = createDefaultGameConfig();
/** The enemy palace floor: a walk-on square from (5, -10) to (25, 10). */
const PALACE_FLOOR = [
  { x: 5, y: -10 },
  { x: 25, y: -10 },
  { x: 25, y: 10 },
  { x: 5, y: 10 },
];

/**
 * A world with a dark Stronghold whose outline is the walk-on palace floor (as `Simulation` builds
 * it, DEC-185 D), and the systems that fly and land attacks, in pipeline order: movement, shots,
 * then combat, on one damage pipeline.
 */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const units = loadDefaultContent(CONFIG.tickRate);
  const projectiles = loadProjectiles(CONFIG.tickRate);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    {
      has: (id) => projectiles.has(id) || STRUCTURE_DEFINITIONS.has(id) || units.has(id),
      get: (id) =>
        projectiles.has(id)
          ? projectiles.get(id)
          : STRUCTURE_DEFINITIONS.has(id)
            ? STRUCTURE_DEFINITIONS.get(id)
            : units.get(id),
    },
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, at: Vec2, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: at, team });
    state.entities.add(entity);
    return entity;
  };
  const stronghold = spawn('stronghold', 'stronghold', { x: 15, y: 0 }, 'dark');
  stronghold.addComponent(new Footprint([PALACE_FLOOR], { isWalkOn: true }));
  const damage = new DamagePipeline();
  const areas = new AreaHitQuery();
  const systems = [
    new MovementSystem(),
    new ProjectileSystem(createDefaultProjectileImpacts(damage, null, areas), areas),
    new CombatSystem({ damage, factory, areas, reach: new ReachQuery() }),
  ];
  const context: SystemContext = { state, logger: new NullLogger() };
  const run = (ticks: number): void => {
    for (let tick = 0; tick < ticks; tick += 1) {
      for (const system of systems) system.update(context);
      state.advanceTick();
    }
  };
  const damaged: string[] = [];
  state.events.on('damage-applied', ({ targetId }) => damaged.push(targetId));
  let shots = 0;
  state.events.on('entity-spawned', ({ kind }) => {
    if (kind === 'projectile') shots += 1;
  });
  const isFull = (entity: Entity): boolean => {
    const health = entity.getComponent(Health);
    return health.current === health.max;
  };
  return { state, spawn, stronghold, run, damaged, shotCount: () => shots, isFull };
};

describe('CombatSystem hit rules across systems (DEC-322, DEC-317 addendum)', () => {
  it('a Legend inside the enemy palace swings at a defender: the defender is hit, not the Stronghold', () => {
    const { state, spawn, stronghold, run, damaged, isFull } = setUp();
    const warrior = spawn('warrior', 'warrior', { x: 10, y: 0 }, 'light');
    const defender = spawn('light-mob', 'training-dummy', { x: 12, y: 0 }, 'dark');

    state.entities.setAttackAim(warrior.id, { x: 12, y: 0 });
    run(1);
    // Aimed at the floor beside the defender, from inside: still no roof brought down.
    state.entities.setAttackAim(warrior.id, { x: 12, y: 3 });
    run(30);

    expect(isFull(stronghold)).toBe(true);
    expect(isFull(defender)).toBe(false);
    expect(damaged.every((id) => id === defender.id)).toBe(true);
  });

  it('from outside, a swing aimed at the palace floor damages the Stronghold', () => {
    const { state, spawn, stronghold, run, damaged, isFull } = setUp();
    const warrior = spawn('warrior', 'warrior', { x: 3, y: 0 }, 'light');

    state.entities.setAttackAim(warrior.id, { x: 8, y: 0 });
    run(1);

    expect(isFull(stronghold)).toBe(false);
    expect(damaged).toEqual([stronghold.id]);
  });

  it('a bolt aimed at the palace floor lands on the Stronghold; one aimed past the palace flies over it', () => {
    const atFloor = setUp();
    const magus = atFloor.spawn('magus', 'magus', { x: -10, y: 0 }, 'light');
    atFloor.state.entities.setAttackAim(magus.id, { x: 15, y: 0 });
    atFloor.run(20);

    expect(atFloor.shotCount()).toBeGreaterThan(0);
    expect(atFloor.isFull(atFloor.stronghold)).toBe(false);

    const past = setUp();
    const other = past.spawn('magus', 'magus', { x: -10, y: 0 }, 'light');
    past.state.entities.setAttackAim(other.id, { x: 40, y: 0 });
    past.run(20);

    expect(past.shotCount()).toBeGreaterThan(0);
    expect(past.isFull(past.stronghold)).toBe(true);
    expect(past.damaged).toEqual([]);
  });

  it.each([
    ['a neutral body that takes no damage now', 'neutral'],
    ['an enemy body that takes no damage now (unbreakable)', 'dark'],
  ] as const)(
    'a bolt stops at %s in its path, with no damage to it or the body behind',
    (_name, team) => {
      const { state, spawn, run, damaged, shotCount, isFull } = setUp();
      const magus = spawn('magus', 'magus', { x: -20, y: 30 }, 'light');
      const blocker = spawn('light-mob', 'training-dummy', { x: -15, y: 30 }, team);
      blocker.getComponent(Collider).setUnbreakable(true);
      const behind = spawn('light-mob', 'training-dummy', { x: -10, y: 30 }, 'dark');

      state.entities.setAttackAim(magus.id, { x: -10, y: 30 });
      run(40);

      expect(shotCount()).toBeGreaterThan(0);
      expect(isFull(blocker)).toBe(true);
      expect(isFull(behind)).toBe(true);
      expect(damaged).toEqual([]);
    },
  );
});
