import { describe, expect, it } from 'vitest';

import { Movement } from '../../components/Movement';
import { ProjectilePayload } from '../../components/ProjectilePayload';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadProjectiles } from '../../content/projectiles/loadProjectiles';
import type { RangedAttack } from '../../content/units/units.types';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { GameState } from '../../state/GameState';
import { IdGenerator } from '../../utils/IdGenerator';
import type { GameEventMap } from '../../state/GameEvents.types';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import { EntityFactory } from '../EntityFactory';
import { Magus } from '../legends/Magus';
import { Warrior } from '../legends/Warrior';
import { RangedProjectileAttackStrategy } from './RangedProjectileAttackStrategy';

const WEAPONS = loadWeapons(30);
const UNITS = loadDefaultContent(30);
const ATTACK = WEAPONS.get('magus-staff').attacks[0] as RangedAttack;
const NO_DAMAGE = { apply: () => undefined };

/** A Magus at the origin and a Warrior 10 m east of it, in one state. */
const setup = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const attacker = new Magus('entity-1', 'magus');
  attacker.spawn({
    definition: UNITS.get('magus'),
    position: { x: 0, y: 0 },
    team: 'light',
    weapons: WEAPONS,
  });
  const target = new Warrior('entity-2', 'warrior');
  target.spawn({
    definition: UNITS.get('warrior'),
    position: { x: 10, y: 0 },
    team: 'dark',
    weapons: WEAPONS,
  });
  state.entities.add(attacker);
  state.entities.add(target);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadProjectiles(30),
    new IdGenerator(2),
    WEAPONS,
  );
  const spawned: GameEventMap['entity-spawned'][] = [];
  state.events.on('entity-spawned', (payload) => spawned.push(payload));
  return { state, attacker, target, factory, spawned };
};

describe('RangedProjectileAttackStrategy', () => {
  it('spawns a projectile at the attacker edge, aimed at the target, with its payload', () => {
    const { state, attacker, factory, spawned } = setup();

    new RangedProjectileAttackStrategy().attack(attacker, 'entity-2', ATTACK, {
      state,
      damage: NO_DAMAGE,
      hits: null,
      factory,
    });

    const shot = state.entities.get('entity-3');
    expect(shot?.kind).toBe('projectile');
    expect(shot?.definitionId).toBe('magus-bolt');
    const radius = attacker.getComponent(Transform).radius;
    expect(shot?.getComponent(Transform).position.x).toBeCloseTo(radius);
    expect(shot?.getComponent(Transform).position.y).toBeCloseTo(0);
    expect(shot?.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });
    const payload = shot?.getComponent(ProjectilePayload);
    expect(payload?.ownerId).toBe('entity-1');
    expect(payload?.team).toBe('light');
    expect(payload?.source).toEqual({
      attackerId: 'entity-1',
      kind: 'weapon',
      definitionId: 'magus-staff',
    });
    expect(payload?.attack).toBe(ATTACK);
    expect(payload?.origin.x).toBeCloseTo(radius);
    expect(spawned).toEqual([{ entityId: 'entity-3', kind: 'projectile', team: 'light' }]);
  });

  it('fires nothing without a factory', () => {
    const { state, attacker } = setup();

    new RangedProjectileAttackStrategy().attack(attacker, 'entity-2', ATTACK, {
      state,
      damage: NO_DAMAGE,
      hits: null,
      factory: null,
    });

    expect(state.entities.has('entity-3')).toBe(false);
  });
});
