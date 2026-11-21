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
  it('spawns a projectile at the attacker centre, aimed at the target, with its payload', () => {
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
    // The centre, not the edge: the shot's circle starts clear of any wall the Magus is kept out of.
    expect(shot?.getComponent(Transform).position).toEqual({ x: 0, y: 0 });
    expect(shot?.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });
    const payload = shot?.getComponent(ProjectilePayload);
    expect(payload?.ownerId).toBe('entity-1');
    expect(payload?.team).toBe('light');
    expect(payload?.targetId).toBe('entity-2');
    expect(payload?.source).toEqual({
      attackerId: 'entity-1',
      kind: 'weapon',
      definitionId: 'magus-staff',
    });
    expect(payload?.impact).toEqual({ kind: 'weapon', attack: ATTACK });
    expect(payload?.origin).toEqual({ x: 0, y: 0 });
    expect(spawned).toEqual([{ entityId: 'entity-3', kind: 'projectile', team: 'light' }]);
  });

  it('fires along the attacker facing when the aim point is its own centre, so the shot moves', () => {
    const { state, attacker, target, factory } = setup();
    target.getComponent(Transform).moveTo({ x: 0, y: 0 });
    attacker.getComponent(Transform).face({ x: 0, y: 1 });

    new RangedProjectileAttackStrategy().attack(attacker, 'entity-2', ATTACK, {
      state,
      damage: NO_DAMAGE,
      hits: null,
      factory,
    });

    expect(state.entities.get('entity-3')?.getComponent(Movement).heading).toEqual({ x: 0, y: 1 });
  });

  it('throws when handed a melee attack, which a miswired registry would do', () => {
    const { state, attacker, factory } = setup();
    const melee = { strategy: 'melee', damage: 40, reach: 1.5, interval: 24 } as const;

    expect(() => {
      new RangedProjectileAttackStrategy().attack(attacker, 'entity-2', melee, {
        state,
        damage: NO_DAMAGE,
        hits: null,
        factory,
      });
    }).toThrow('cannot fire a "melee" attack');
    expect(state.entities.has('entity-3')).toBe(false);
  });

  it('throws when the target has no point to aim at, rather than spend the attack on nothing', () => {
    const { state, attacker, factory } = setup();

    expect(() => {
      new RangedProjectileAttackStrategy().attack(attacker, 'entity-404', ATTACK, {
        state,
        damage: NO_DAMAGE,
        hits: null,
        factory,
      });
    }).toThrow('no point to aim at on "entity-404"');
    expect(state.entities.has('entity-3')).toBe(false);
  });
});
