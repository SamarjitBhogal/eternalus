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
import { VeterancySystem } from './VeterancySystem';

const setUp = () => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const config = createDefaultGameConfig();
  const state = new GameState(config, 1, TWO_LANE_MAP, space);
  const units = loadDefaultContent(30);
  const factory = new EntityFactory(createDefaultEntityRegistry(), units);
  const statuses = new StatusEffectApplier(loadStatusEffects(30, 2));
  const system = new VeterancySystem(state, statuses, units, MINION_VETERANCY);
  const add = (team: 'light' | 'dark', x: number) => {
    const entity = factory.create('light-mob', 'light-minion', { team, position: { x, y: 20 } });
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
  const kill = (isMinion = true) => {
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
      killer: { attackerId: killer.id, kind: 'weapon', definitionId: 'light-minion' },
    });
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
  return { state, killer, neighbour, far, enemy, kill, step };
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

  it('counts only kills of lane minions by lane minions', () => {
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

  it('spreads the aura only on its cadence', () => {
    const { state, neighbour, kill, step } = setUp();
    kill();
    kill();
    state.advanceTick(); // tick 1: off the cadence (every 15 ticks)

    step();

    expect(statusesOf(neighbour)).toEqual([]);
  });
});
