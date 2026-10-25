import { describe, expect, it } from 'vitest';

import { Movement } from '../components/Movement';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { HordeSystem } from './HordeSystem';

const FACTOR = 0.5;
const logger = new NullLogger();

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP);
  const system = new HordeSystem(state, FACTOR);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const addHorde = (members: readonly [string, string][], progress = 0) => {
    const memberIds = members.map(([kind, definitionId]) => {
      const entity = factory.create(kind, definitionId, {
        team: 'light',
        position: { x: 20, y: 20 },
      });
      state.entities.add(entity);
      return entity.id;
    });
    const hordeId = state.hordes.nextId();
    state.hordes.add({
      id: hordeId,
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds,
      progress,
    });
    return { hordeId, memberIds };
  };
  return { state, system, addHorde };
};

describe('HordeSystem', () => {
  it('drops removed and re-teamed members on its next pass and dissolves an empty horde', () => {
    const { state, system, addHorde } = setUp();
    const { hordeId, memberIds } = addHorde([
      ['light-mob', 'light-minion'],
      ['light-mob', 'light-minion'],
    ]);
    const dissolved: string[] = [];
    state.events.on('horde-dissolved', ({ hordeId: id }) => dissolved.push(id));
    const [first = '', second = ''] = memberIds;

    state.events.emit('entity-removed', { entityId: first, cause: 'dev-removed' });
    expect(state.hordes.get(hordeId)?.leaderId).toBe(first);
    system.update({ state, logger });
    expect(state.hordes.get(hordeId)?.leaderId).toBe(second);

    state.events.emit('team-changed', {
      entityId: second,
      from: 'light',
      to: 'dark',
      cause: 'test',
    });
    system.update({ state, logger });
    expect(state.hordes.get(hordeId)).toBeUndefined();
    expect(dissolved).toEqual([hordeId]);

    state.events.emit('entity-removed', { entityId: 'entity-99', cause: 'died' });
    system.update({ state, logger });
    expect(dissolved).toEqual([hordeId]);
  });

  it('advances the anchor at a fraction of the slowest member’s speed, up to the lane end', () => {
    const { state, system, addHorde } = setUp();
    const { hordeId, memberIds } = addHorde([
      ['light-mob', 'light-minion'],
      ['heavy-mob', 'heavy-minion'],
    ]);
    const heavy = state.entities.get(memberIds[1] ?? '')?.getComponent(Movement).maxSpeed ?? 0;
    const light = state.entities.get(memberIds[0] ?? '')?.getComponent(Movement).maxSpeed ?? 0;
    expect(heavy).toBeLessThan(light);

    system.update({ state, logger });
    expect(state.hordes.get(hordeId)?.progress).toBeCloseTo(heavy * FACTOR);

    state.hordes.setProgress(hordeId, 159.99);
    system.update({ state, logger });
    expect(state.hordes.get(hordeId)?.progress).toBe(160);
  });

  it('holds the anchor while the leader has an attack target, and marches again after', () => {
    const { state, system, addHorde } = setUp();
    const { hordeId, memberIds } = addHorde([['light-mob', 'light-minion']], 10);
    const [leader = ''] = memberIds;
    const { memberIds: enemies } = addHorde([['light-mob', 'training-dummy']]);
    state.entities.setAttackTarget(leader, enemies[0] ?? '');

    system.update({ state, logger });
    expect(state.hordes.get(hordeId)?.progress).toBe(10);

    state.entities.clearAttackTarget(leader);
    system.update({ state, logger });
    expect(state.hordes.get(hordeId)?.progress).toBeGreaterThan(10);
  });

  it('does nothing without a map', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const system = new HordeSystem(state, FACTOR);

    expect(() => {
      system.update({ state, logger });
    }).not.toThrow();
  });
});
