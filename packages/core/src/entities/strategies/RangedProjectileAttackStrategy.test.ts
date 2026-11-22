import { describe, expect, it } from 'vitest';

import { Footprint } from '../../components/Footprint';
import { Movement } from '../../components/Movement';
import { ProjectilePayload } from '../../components/ProjectilePayload';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadProjectiles } from '../../content/projectiles/loadProjectiles';
import type { RangedAttack } from '../../content/units/units.types';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { AreaHitQuery } from '../../state/AreaHitQuery';
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
const EAST_AT_TARGET = { targetId: 'entity-2', point: null, direction: { x: 1, y: 0 } };
const AREAS = new AreaHitQuery();

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

    new RangedProjectileAttackStrategy().attack(attacker, EAST_AT_TARGET, ATTACK, {
      state,
      damage: NO_DAMAGE,
      hits: null,
      factory,
      areas: AREAS,
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

  it('flies along the aim direction, even with no target, and names no target in the payload', () => {
    const { state, attacker, factory } = setup();

    new RangedProjectileAttackStrategy().attack(
      attacker,
      { targetId: null, point: { x: 0, y: 10 }, direction: { x: 0, y: 1 } },
      ATTACK,
      { state, damage: NO_DAMAGE, hits: null, factory, areas: AREAS },
    );

    const shot = state.entities.get('entity-3');
    expect(shot?.getComponent(Movement).heading).toEqual({ x: 0, y: 1 });
    expect(shot?.getComponent(ProjectilePayload).targetId).toBeNull();
  });

  it('names the walk-on outline the aim point is on as its target, so the shot can hit it (DEC-322 (1))', () => {
    const { state, attacker, factory } = setup();
    const palace = new Warrior('entity-9', 'warrior');
    palace.spawn({
      definition: UNITS.get('warrior'),
      position: { x: 30, y: 30 },
      team: 'dark',
      weapons: WEAPONS,
    });
    palace.addComponent(
      new Footprint(
        [
          [
            { x: 20, y: -10 },
            { x: 40, y: -10 },
            { x: 40, y: 10 },
            { x: 20, y: 10 },
          ],
        ],
        { isWalkOn: true },
      ),
    );
    state.entities.add(palace);
    const fire = (targetId: string | null, point: { x: number; y: number }) => {
      new RangedProjectileAttackStrategy().attack(
        attacker,
        { targetId, point, direction: { x: 1, y: 0 } },
        ATTACK,
        { state, damage: NO_DAMAGE, hits: null, factory, areas: AREAS },
      );
    };

    fire(null, { x: 25, y: 0 });
    fire(null, { x: 15, y: 0 });
    fire('entity-2', { x: 25, y: 0 });

    const targets = ['entity-3', 'entity-4', 'entity-5'].map(
      (id) => state.entities.get(id)?.getComponent(ProjectilePayload).targetId,
    );
    // On the floor; off it; the locked target first.
    expect(targets).toEqual(['entity-9', null, 'entity-2']);
  });

  it('throws when handed a melee attack, which a miswired registry would do', () => {
    const { state, attacker, factory } = setup();
    const melee = { strategy: 'melee', damage: 40, reach: 1.5, interval: 24 } as const;

    expect(() => {
      new RangedProjectileAttackStrategy().attack(attacker, EAST_AT_TARGET, melee, {
        state,
        damage: NO_DAMAGE,
        hits: null,
        factory,
        areas: AREAS,
      });
    }).toThrow('cannot fire a "melee" attack');
    expect(state.entities.has('entity-3')).toBe(false);
  });
});
