import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { Veterancy } from '../components/Veterancy';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { MINION_VETERANCY } from '../content/mobs/minionVeterancy';
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
  const kill = () => {
    const victim = add('dark', 51);
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

  it('ignores kills by a unit in no horde and kills of a structure-free non-mob victim', () => {
    const { state, enemy, step } = setUp();
    const victim = state.entities.get(enemy.id);
    state.events.emit('entity-died', {
      entityId: 'entity-404',
      killer: { attackerId: enemy.id, kind: 'weapon', definitionId: 'light-minion' },
    });
    state.events.emit('entity-died', {
      entityId: enemy.id,
      killer: { attackerId: null, kind: 'environment', definitionId: 'rift' },
    });
    step();

    expect(victim?.findComponent(Veterancy)).toBeUndefined();
  });
});
