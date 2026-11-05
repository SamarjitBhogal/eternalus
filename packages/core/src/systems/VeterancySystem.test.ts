import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { Veterancy } from '../components/Veterancy';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { MINION_VETERANCY } from '../content/mobs/minionVeterancy';
import { VETERAN } from '../content/status-effects/veteran';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { VeterancySystem } from './VeterancySystem';

const setUp = (config = createDefaultGameConfig()) => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP), { space });
  const units = loadDefaultContent(30);
  const factory = new EntityFactory(createDefaultEntityRegistry(), units);
  const statuses = new StatusEffectApplier(loadStatusEffects(30, 2));
  const system = new VeterancySystem(state, statuses, units, MINION_VETERANCY);
  const add = (team: 'light' | 'dark', x: number, mobId = 'light-minion') => {
    const entity = factory.create('light-mob', mobId, { team, position: { x, y: 20 } });
    state.entities.add(entity);
    return entity;
  };
  const killer = add('light', 50);
  const neighbour = add('light', 52);
  const far = add('light', 60);
  const enemy = add('dark', 53);
  state.hordes.add({
    id: 'horde-1',
    team: 'light',
    weightClass: 'light',
    lane: 'lane-0',
    formationId: 'ranks',
    memberIds: [killer.id, neighbour.id, far.id],
    progress: 0,
  });
  let hordes = 1;
  const kill = (isMinion = true, killerId = killer.id) => {
    const victim = add('dark', 51);
    if (isMinion) {
      hordes += 1;
      state.hordes.add({
        id: `horde-${String(hordes)}`,
        team: 'dark',
        weightClass: 'light',
        lane: 'lane-0',
        formationId: 'ranks',
        memberIds: [victim.id],
        progress: 0,
      });
    }
    victim.getComponent(Health).applyDamage(1e6);
    state.events.emit('entity-died', {
      entityId: victim.id,
      killer: { attackerId: killerId, kind: 'weapon', definitionId: 'light-minion' },
    });
  };
  /** Puts a new `mobId` on a post of `team` (a tower guard; a camp mob on a `neutral` post). */
  const guard = (team: 'light' | 'neutral', mobId: string) => {
    const entity = add('light', 48, mobId);
    state.guards.add({
      id: `post-${String(state.guards.size)}`,
      homeId: 'home',
      team,
      mobId,
      row: 0,
      indexInRow: 0,
      postX: 48,
      postY: 20,
      homeX: 48,
      homeY: 18,
      homeRadius: 1,
      leashRadius: 6,
      leashTolerance: 1,
      respawnTicks: 30,
    });
    state.guards.fill(state.guards.size - 1, entity.id);
    return entity;
  };
  const step = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
    system.update({ state, logger: new NullLogger() });
  };
  return { state, system, killer, neighbour, far, enemy, add, kill, guard, step };
};

const statusesOf = (entity: {
  findComponent: (type: typeof StatusEffects) => StatusEffects | undefined;
}) =>
  entity
    .findComponent(StatusEffects)
    ?.active.map(({ definition, stacks }) => [definition.id, stacks]) ?? [];

describe('VeterancySystem', () => {
  it('levels a horde minion up every two mob kills: more health, a veteran stack', () => {
    const { killer, kill, step } = setUp();
    kill();
    step();
    expect(killer.getComponent(Veterancy).level).toBe(0);
    expect(killer.getComponent(Health).max).toBe(150);

    kill();
    step();

    expect(killer.getComponent(Veterancy).level).toBe(1);
    expect(killer.getComponent(Health).max).toBeCloseTo(165);
    expect(killer.getComponent(Health).current).toBeCloseTo(165);
    expect(statusesOf(killer)).toContainEqual(['veteran', 1]);
  });

  it('rallies the friendly horde minions within the aura radius, and no one else', () => {
    const { killer, neighbour, far, enemy, kill, step } = setUp();
    kill();
    kill();
    step();

    expect(statusesOf(neighbour)).toContainEqual(['rallied', 1]);
    expect(statusesOf(far)).toEqual([]);
    expect(statusesOf(enemy)).toEqual([]);
    expect(statusesOf(killer).map(([id]) => id)).not.toContain('rallied');
  });

  it('counts only kills of lane minions, by lane minions or tower guards', () => {
    const { state, killer, enemy, kill, step } = setUp();
    kill(false); // a mob in no horde: a guard or camp mob
    state.events.emit('entity-died', {
      entityId: killer.id,
      killer: { attackerId: enemy.id, kind: 'weapon', definitionId: 'light-minion' },
    });
    step();

    expect(killer.findComponent(Veterancy)).toBeUndefined();
    expect(enemy.findComponent(Veterancy)).toBeUndefined();
  });

  it('stops at the level cap, with one veteran stack per level', () => {
    const { killer, kill, step } = setUp();
    for (let count = 0; count < 2 * MINION_VETERANCY.maxLevel + 2; count += 1) {
      kill();
    }
    step();

    expect(killer.getComponent(Veterancy).level).toBe(MINION_VETERANCY.maxLevel);
    expect(killer.getComponent(Health).max).toBeCloseTo(
      150 * (1 + 0.1 * MINION_VETERANCY.maxLevel),
    );
    expect(statusesOf(killer)).toContainEqual(['veteran', MINION_VETERANCY.maxLevel]);
    // The veteran status caps its stacks where the levels stop.
    expect(VETERAN.maxStacks).toBe(MINION_VETERANCY.maxLevel);
  });

  it('adds +10% damage per level, not compounding: x1.1, x1.2, x1.3 (DEC-164)', () => {
    const { killer, kill, step } = setUp();
    const damage = [1, 2, 3].map(() => {
      kill();
      kill();
      step();
      return killer.getComponent(StatusEffects).multiplier('damageDealt').toFixed(6);
    });

    expect(damage).toEqual(['1.100000', '1.200000', '1.300000']);
  });

  it('levels a tower guard from its own kills, but not a camp mob (DEC-165)', () => {
    const { guard, kill, step } = setUp();
    const towerGuard = guard('light', 'light-guard');
    const campMob = guard('neutral', 'light-camp-mob');
    for (const id of [towerGuard.id, towerGuard.id, campMob.id, campMob.id]) {
      kill(true, id);
    }
    step();

    expect(towerGuard.getComponent(Veterancy).level).toBe(1);
    expect(towerGuard.getComponent(Health).max).toBeCloseTo(165);
    expect(statusesOf(towerGuard)).toContainEqual(['veteran', 1]);
    expect(campMob.findComponent(Veterancy)).toBeUndefined();
    expect(campMob.getComponent(Health).max).toBe(150);
  });

  it('rallies a friendly tower guard in range of a levelled minion, but not a camp mob (DEC-165)', () => {
    const { guard, kill, step } = setUp();
    const towerGuard = guard('light', 'light-guard');
    const campMob = guard('neutral', 'light-camp-mob');
    kill();
    kill();
    step();

    expect(statusesOf(towerGuard)).toContainEqual(['rallied', 1]);
    expect(statusesOf(campMob)).toEqual([]);
  });

  it('counts a killed tower guard and a killed camp mob as kills (DEC-165, owner 2026-11-04)', () => {
    const { guard, killer, state, step } = setUp();
    const died = (entityId: string) => {
      state.events.emit('entity-died', {
        entityId,
        killer: { attackerId: killer.id, kind: 'weapon', definitionId: 'light-minion' },
      });
    };
    const towerGuard = guard('light', 'light-guard');
    const campMob = guard('neutral', 'light-camp-mob');
    died(towerGuard.id);
    step();
    expect(killer.getComponent(Veterancy).level).toBe(0);

    died(campMob.id);
    step();

    expect(killer.getComponent(Veterancy).level).toBe(1);
  });

  it('gains levels from another source with their effects, and the next kill keeps them', () => {
    const { state, system, killer, kill, step } = setUp();

    expect(system.gainLevels(state, killer.id, 1)).toBe(1);
    expect(killer.getComponent(Veterancy).level).toBe(1);
    expect(killer.getComponent(Health).max).toBeCloseTo(165);
    expect(statusesOf(killer)).toContainEqual(['veteran', 1]);

    kill();
    step();
    expect(killer.getComponent(Veterancy).level).toBe(1);
    kill();
    step();
    expect(killer.getComponent(Veterancy).level).toBe(2);
    // Never past the cap: one more level is left.
    expect(system.gainLevels(state, killer.id, 5)).toBe(1);
    expect(statusesOf(killer)).toContainEqual(['veteran', MINION_VETERANCY.maxLevel]);
  });

  it('rallies every friendly horde minion in range, however small the unit cap', () => {
    const { state, killer, add, kill, step } = setUp(
      createDefaultGameConfig({ limits: { maxUnitsPerTeam: 1 } }),
    );
    kill();
    kill();
    const late = add('light', 53.5); // queried last: its cell comes after the killer's
    state.hordes.add({
      id: 'horde-late',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [late.id],
      progress: 0,
    });
    step();

    expect(killer.getComponent(Veterancy).level).toBe(1);
    expect(statusesOf(late)).toContainEqual(['rallied', 1]);
  });

  it('spreads the aura only on its cadence', () => {
    const { state, neighbour, kill, step } = setUp();
    kill();
    kill();
    state.advanceTick(); // tick 1: off the cadence (every 15 ticks)

    step();

    expect(statusesOf(neighbour)).toEqual([]);
  });

  it('hashes a levelled-up minion the same in two runs, and a further kill differently', () => {
    const levelled = () => {
      const run = setUp();
      run.kill();
      run.kill();
      run.step();
      expect(run.killer.getComponent(Veterancy).level).toBe(1);
      return run;
    };
    const hasher = new StateHasher();
    const first = levelled();
    const second = levelled();

    expect(hasher.hash(first.state)).toBe(hasher.hash(second.state));

    // A third kill stays inside level 1, so only the kill count differs from the other run.
    second.killer
      .getComponent(Veterancy)
      .recordKill(MINION_VETERANCY.killsPerLevel, MINION_VETERANCY.maxLevel);
    expect(second.killer.getComponent(Veterancy).level).toBe(1);
    expect(hasher.hash(first.state)).not.toBe(hasher.hash(second.state));
  });
});
