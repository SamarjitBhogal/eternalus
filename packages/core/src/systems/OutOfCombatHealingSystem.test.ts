import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { OUT_OF_COMBAT_HEALING } from '../content/healing/outOfCombatHealing';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import { OutOfCombatHealingSystem } from './OutOfCombatHealingSystem';

const logger = new NullLogger();
const TICK_RATE = 30;
const DELAY = OUT_OF_COMBAT_HEALING.delaySeconds * TICK_RATE;
const FAR = { x: 100, y: 30 };
const UNDER_LIGHT_SPAWNER = { x: 62, y: 20 };

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
  spawnMapStructures(state);
  const system = new OutOfCombatHealingSystem(state, OUT_OF_COMBAT_HEALING);
  const definitions = loadDefaultContent(TICK_RATE);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    definitions,
    undefined,
    loadWeapons(TICK_RATE),
  );
  const add = (kind: string, id: string, team: Team, position = FAR): Entity => {
    const entity = factory.create(kind, id, { position, team });
    state.entities.add(entity);
    return entity;
  };
  const minion = (team: Team = 'light', position = FAR) =>
    add('light-mob', 'light-minion', team, position);
  const wound = (entity: Entity, fraction = 0.5): Health => {
    const health = entity.getComponent(Health);
    health.applyDamage(health.max * fraction);
    return health;
  };
  const hit = (targetId: string, attackerId: string | null = null): void => {
    state.events.emit('damage-applied', {
      targetId,
      amount: 1,
      absorbed: 0,
      source: { attackerId, kind: 'weapon', definitionId: 'test' },
    });
  };
  const tickTo = (tick: number) => {
    while (state.tick < tick) state.advanceTick();
  };
  /** Advances to `tick`, runs the system once, and returns the health gained by that one run. */
  const gainAt = (tick: number, health: Health): number => {
    tickTo(tick);
    const before = health.current;
    system.update({ state, logger });
    return health.current - before;
  };
  const tower = (kind: string, team: Team): Entity => {
    let found: Entity | undefined;
    state.entities.forEach((entity) => {
      if (entity.kind === kind && state.entities.teamOf(entity.id) === team) found ??= entity;
    });
    if (found === undefined) throw new Error('no tower');
    return found;
  };
  return { state, add, minion, wound, hit, gainAt, tower, tickTo, system };
};

describe('OutOfCombatHealingSystem', () => {
  it('heals nothing before 10 s out of combat and something from then on', () => {
    const { minion, wound, gainAt } = setUp();
    const health = wound(minion());

    expect(gainAt(DELAY - 1, health)).toBe(0);
    expect(gainAt(DELAY, health)).toBeGreaterThan(0);
  });

  it('heals 2% of max health per second, flat', () => {
    const { minion, wound, gainAt, add } = setUp();
    const small = wound(minion());
    const legend = wound(add('warrior', 'warrior', 'light'));

    const smallGain = gainAt(DELAY, small);
    const legendGain = legend.current - legend.max / 2;

    expect(smallGain).toBeCloseTo((small.max * 0.02) / TICK_RATE, 9);
    expect(legendGain).toBeCloseTo((legend.max * 0.02) / TICK_RATE, 9);
  });

  it('restarts the delay when the unit takes damage', () => {
    const { minion, wound, hit, gainAt, tickTo } = setUp();
    const unit = minion();
    const health = wound(unit);
    tickTo(DELAY - 10);
    hit(unit.id);

    expect(gainAt(DELAY, health)).toBe(0);
    expect(gainAt(DELAY - 10 + DELAY, health)).toBeGreaterThan(0);
  });

  it('restarts the delay when the unit deals damage', () => {
    const { minion, wound, hit, gainAt, tickTo } = setUp();
    const attacker = minion();
    const victim = minion('dark');
    const health = wound(attacker);
    tickTo(DELAY - 10);
    hit(victim.id, attacker.id);

    expect(gainAt(DELAY, health)).toBe(0);
    expect(gainAt(DELAY - 10 + DELAY, health)).toBeGreaterThan(0);
  });

  it('adds 10 points (12% per second) within 12 m of a friendly tower with no damage taken', () => {
    const { minion, wound, gainAt } = setUp();
    const health = wound(minion('light', UNDER_LIGHT_SPAWNER));

    expect(gainAt(DELAY, health)).toBeCloseTo((health.max * 0.12) / TICK_RATE, 9);
  });

  it('counts a friendly buff-tower too, and not one 12 m away or more', () => {
    const { minion, wound, gainAt } = setUp();
    const near = wound(minion('light', { x: 50, y: 51 }));
    const away = wound(minion('light', { x: 50, y: 53 }));

    expect(gainAt(DELAY, near)).toBeCloseTo((near.max * 0.12) / TICK_RATE, 9);
    expect(away.current - away.max / 2).toBeCloseTo((away.max * 0.02) / TICK_RATE, 9);
  });

  it('gives no bonus under an enemy tower', () => {
    const { minion, wound, gainAt } = setUp();
    const health = wound(minion('dark', UNDER_LIGHT_SPAWNER));

    expect(gainAt(DELAY, health)).toBeCloseTo((health.max * 0.02) / TICK_RATE, 9);
  });

  it('gives no bonus while the tower is under attack, and gives it back after 10 s quiet', () => {
    const { minion, wound, hit, gainAt, tower, tickTo } = setUp();
    const health = wound(minion('light', UNDER_LIGHT_SPAWNER));
    tickTo(DELAY - 5);
    hit(tower('spawner-tower', 'light').id, 'enemy');

    expect(gainAt(DELAY, health)).toBeCloseTo((health.max * 0.02) / TICK_RATE, 9);
    expect(gainAt(DELAY - 5 + DELAY, health)).toBeCloseTo((health.max * 0.12) / TICK_RATE, 9);
  });

  it('gives no bonus from a destroyed tower', () => {
    const { minion, wound, gainAt, tower } = setUp();
    const health = wound(minion('light', UNDER_LIGHT_SPAWNER));
    wound(tower('spawner-tower', 'light'), 1);

    expect(gainAt(DELAY, health)).toBeCloseTo((health.max * 0.02) / TICK_RATE, 9);
  });

  it('never heals the dead', () => {
    const { minion, wound, gainAt } = setUp();
    const health = wound(minion(), 1);

    expect(gainAt(DELAY, health)).toBe(0);
    expect(health.isDead).toBe(true);
  });

  it('never heals above max health', () => {
    const { minion, wound, gainAt } = setUp();
    const health = wound(minion(), 0.0001);

    expect(gainAt(DELAY, health)).toBeCloseTo(health.max * 0.0001, 9);
    expect(health.current).toBe(health.max);
    expect(gainAt(DELAY + 1, health)).toBe(0);
  });

  it('heals a camp mob and does not heal structures', () => {
    const { add, wound, gainAt, tower } = setUp();
    const camp = wound(add('light-mob', 'light-camp-mob', 'neutral'));
    const structure = wound(tower('spawner-tower', 'dark'));
    const before = structure.current;

    expect(gainAt(DELAY, camp)).toBeGreaterThan(0);
    expect(structure.current).toBe(before);
  });
});
