import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Combat } from '../../components/Combat';
import { Footprint } from '../../components/Footprint';
import { Health } from '../../components/Health';
import { MapObjectBody } from '../../components/MapObjectBody';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { MAP_OBJECT_DEFINITIONS } from '../../content/maps/mapObjectDefinitions';
import type { SweepAttack } from '../../content/units/units.types';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import type { DamageSource } from '../../state/GameEvents.types';
import { GameState } from '../../state/GameState';
import type { Team } from '../../teams/teams.types';
import { IdGenerator } from '../../utils/IdGenerator';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import type { Entity } from '../Entity';
import { EntityFactory } from '../EntityFactory';
import { MeleeSweepAttackStrategy } from './MeleeSweepAttackStrategy';

const CONFIG = createDefaultGameConfig();
const UNITS = loadDefaultContent(CONFIG.tickRate);
const WEAPONS = loadWeapons(CONFIG.tickRate);
/** Reach 3 m from the Warrior's body edge (radius 0.5): the sector reaches 3.5 m. */
const SWEEP: SweepAttack = {
  strategy: 'melee-sweep',
  damage: 40,
  reach: 3,
  interval: 21,
  arcDegrees: 90,
};
const EAST = { x: 1, y: 0 };

/** A Warrior (light) at the origin; `spawn` adds dummies, `swing` sweeps along `direction`. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    {
      has: (id) => id === MAP_OBJECT_DEFINITIONS.house.id || UNITS.has(id),
      get: (id) =>
        id === MAP_OBJECT_DEFINITIONS.house.id ? MAP_OBJECT_DEFINITIONS.house : UNITS.get(id),
    },
    new IdGenerator(0),
    WEAPONS,
  );
  const attacker = factory.create('warrior', 'warrior', {
    position: { x: 0, y: 0 },
    team: 'light',
  });
  state.entities.add(attacker);
  const spawn = (x: number, y: number, team: Team): Entity => {
    const entity = factory.create('light-mob', 'training-dummy', { position: { x, y }, team });
    state.entities.add(entity);
    return entity;
  };
  const calls: string[][] = [];
  const sources: DamageSource[] = [];
  const swing = (
    aim: { targetId: string | null; direction: { x: number; y: number } } = {
      targetId: null,
      direction: EAST,
    },
  ) => {
    new MeleeSweepAttackStrategy().attack(attacker, aim, SWEEP, {
      state,
      damage: {
        apply: (_state, targetId, amount, source) => {
          calls.push(['damage', targetId, String(amount)]);
          sources.push(source);
        },
      },
      hits: {
        afterHit: (_state, attackerId, targetId) => calls.push(['after-hit', attackerId, targetId]),
      },
      factory,
    });
  };
  return { state, factory, attacker, spawn, swing, calls, sources };
};

const damaged = (calls: string[][]): string[] =>
  calls.filter(([kind]) => kind === 'damage').map(([, id]) => id ?? '');

describe('MeleeSweepAttackStrategy', () => {
  it('hits every enemy in front inside the reach, and nothing behind, beside, beyond or allied', () => {
    const { spawn, swing, calls } = setUp();
    const front = spawn(2, 0, 'dark');
    const frontFar = spawn(3.8, 0, 'dark'); // 3.8 - 0.4 = 3.4 <= 3.5: its edge is inside
    const beyond = spawn(4.2, 0, 'dark'); // 4.2 - 0.4 = 3.8 > 3.5
    const behind = spawn(-2, 0, 'dark');
    const beside = spawn(0, 2.5, 'dark');
    const ally = spawn(2, 0.1, 'light');

    swing();

    expect(damaged(calls)).toEqual([front.id, frontFar.id]);
    for (const left of [beyond, behind, beside, ally]) {
      expect(damaged(calls)).not.toContain(left.id);
    }
  });

  it('hits in id order, whatever order the bodies were added to the store in', () => {
    const { state, factory, swing, calls } = setUp();
    const make = (x: number) =>
      factory.create('light-mob', 'training-dummy', { position: { x, y: 0 }, team: 'dark' });
    const first = make(1.5);
    const second = make(2.5);
    state.entities.add(second);
    state.entities.add(first);

    swing();

    expect(damaged(calls)).toEqual([first.id, second.id]);
  });

  it('hits a body just outside the arc whose circle touches the edge of the wedge', () => {
    const { spawn, swing, calls } = setUp();
    // The upper edge is the line y = x; (2, 2.4) is outside the angle, 0.28 m from the edge line.
    const touching = spawn(2, 2.4, 'dark');
    const clear = spawn(2, 3, 'dark');

    swing();

    expect(damaged(calls)).toEqual([touching.id]);
    expect(damaged(calls)).not.toContain(clear.id);
  });

  it('hits a minion and a map object in one swing, damage first then on-hit for each, in id order', () => {
    const { state, factory, attacker, spawn, swing, calls, sources } = setUp();
    const minion = spawn(2, 0, 'dark');
    const house = factory.create('obstacle', MAP_OBJECT_DEFINITIONS.house.id, {
      position: { x: 20, y: 20 },
    });
    house.addComponent(
      new MapObjectBody({
        id: 'house',
        kind: 'house',
        isBlocking: true,
        footprints: [
          [
            { x: 1, y: -1 },
            { x: 3, y: -1 },
            { x: 3, y: -3 },
            { x: 1, y: -3 },
          ],
        ],
      }),
    );
    state.entities.add(house);

    swing();

    // The house corner (1, -1) lies on the wedge's lower edge, 1.4 m away: inside.
    expect(damaged(calls).sort()).toEqual([house.id, minion.id].sort());
    expect(calls.filter(([kind]) => kind === 'after-hit').map(([, , id]) => id)).toEqual(
      damaged(calls),
    );
    expect(calls.map(([kind]) => kind)).toEqual(['damage', 'after-hit', 'damage', 'after-hit']);
    expect(sources[0]).toEqual({
      attackerId: attacker.id,
      kind: 'weapon',
      definitionId: attacker.getComponent(Combat).weaponId,
    });
  });

  it('hits a body with an outline when the attacker stands inside it, and not one whose outline is out of reach', () => {
    const { spawn, swing, calls } = setUp();
    const around = spawn(30, 30, 'dark'); // centre far away; its outline surrounds the attacker
    around.addComponent(
      new Footprint([
        [
          { x: -10, y: -10 },
          { x: -5, y: -10 },
          { x: -5, y: 10 },
          { x: -10, y: 10 },
        ],
      ]),
    );
    const enclosing = spawn(0, 0, 'dark');
    enclosing.addComponent(
      new Footprint([
        [
          { x: -4, y: -4 },
          { x: 4, y: -4 },
          { x: 4, y: 4 },
          { x: -4, y: 4 },
        ],
      ]),
    );

    swing({ targetId: null, direction: { x: -1, y: 0 } });

    // The attacker stands inside `enclosing`; `around` lies behind a 5 m gap, beyond the 3.5 m reach.
    expect(damaged(calls)).toEqual([enclosing.id]);
  });

  it('hits a wall whose edge crosses the wedge with no corner inside it', () => {
    const { spawn, swing, calls } = setUp();
    const wall = spawn(30, 30, 'dark');
    wall.addComponent(
      new Footprint([
        [
          { x: 2, y: -50 },
          { x: 2.5, y: -50 },
          { x: 2.5, y: 50 },
          { x: 2, y: 50 },
        ],
      ]),
    );

    swing();

    expect(damaged(calls)).toEqual([wall.id]);
  });

  it('passes over a walk-on outline it stands in (a palace floor) unless it is the locked target (DEC-317)', () => {
    const { spawn, swing, calls } = setUp();
    const floor = spawn(30, 30, 'dark');
    floor.addComponent(
      new Footprint(
        [
          [
            { x: -4, y: -4 },
            { x: 4, y: -4 },
            { x: 4, y: 4 },
            { x: -4, y: 4 },
          ],
        ],
        { isWalkOn: true },
      ),
    );

    swing();
    expect(calls).toEqual([]);

    swing({ targetId: floor.id, direction: EAST });
    expect(damaged(calls)).toEqual([floor.id]);
  });

  it('does not hit a body that takes no damage now (an unbreakable gate) unless it is the locked target (DEC-317)', () => {
    const { spawn, swing, calls } = setUp();
    const gate = spawn(2, 0, 'dark');
    gate.getComponent(Collider).setUnbreakable(true);

    swing();
    expect(calls).toEqual([]);

    swing({ targetId: gate.id, direction: EAST });
    expect(damaged(calls)).toEqual([gate.id]);
  });

  it('always hits the locked target, even one the wedge does not reach', () => {
    const { spawn, swing, calls } = setUp();
    const locked = spawn(0, 3, 'dark');

    swing({ targetId: locked.id, direction: EAST });

    expect(damaged(calls)).toEqual([locked.id]);
  });

  it('skips a dead body', () => {
    const { spawn, swing, calls } = setUp();
    const dead = spawn(2, 0, 'dark');
    dead.getComponent(Health).applyDamage(1_000_000);

    swing();

    expect(calls).toEqual([]);
  });

  it('records the swing on the attacker for the swing visual', () => {
    const { state, attacker, swing } = setUp();
    state.advanceTick();

    swing({ targetId: null, direction: { x: 0, y: 1 } });

    expect(attacker.getComponent(Combat).lastSwing).toEqual({
      tick: 1,
      direction: { x: 0, y: 1 },
      radius: 3.5,
      arcDegrees: 90,
    });
  });

  it('throws when handed an attack that is not a sweep, which a miswired registry would do', () => {
    const { attacker, state, factory } = setUp();

    expect(() => {
      new MeleeSweepAttackStrategy().attack(
        attacker,
        { targetId: null, direction: EAST },
        { strategy: 'melee', damage: 1, reach: 1, interval: 1 },
        { state, damage: { apply: () => undefined }, hits: null, factory },
      );
    }).toThrow('cannot swing a "melee" attack');
  });
});
