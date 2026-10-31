import { describe, expect, it } from 'vitest';

import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { StatusEffects } from '../components/StatusEffects';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { ENRAGING_STRUCTURES } from '../content/mobs/minionModifiers';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { GameState } from '../state/GameState';
import type { PlayableTeam, Team } from '../teams/teams.types';
import { EnragedSystem } from './EnragedSystem';

const logger = new NullLogger();

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
  const statuses = new StatusEffectApplier(loadStatusEffects(30, 2));
  const system = new EnragedSystem(state, statuses, ENRAGING_STRUCTURES);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const addHorde = (team: PlayableTeam, lane: string) => {
    const member = factory.create('light-mob', 'light-minion', {
      team,
      position: { x: 50, y: 20 },
    });
    state.entities.add(member);
    const horde = state.hordes.add({
      id: state.hordes.nextId(),
      team,
      weightClass: 'light',
      lane,
      formationId: 'ranks',
      memberIds: [member.id],
      progress: 0,
    });
    return { horde, member };
  };
  const stacksOf = (entity: { getComponent: (c: typeof StatusEffects) => StatusEffects }) =>
    entity.getComponent(StatusEffects).active.find(({ definition }) => definition.id === 'enraged')
      ?.stacks ?? 0;
  const lose = (team: Team, kind: string, lane: string | null = 'lane-0') => {
    state.events.emit('structure-destroyed', { entityId: 'tower', kind, team, lane });
  };
  return { state, system, addHorde, stacksOf, lose };
};

describe('EnragedSystem', () => {
  it('adds a stack to the losing team’s minions on that lane only, per lost tower', () => {
    const { state, system, addHorde, stacksOf, lose } = setUp();
    const mine = addHorde('light', 'lane-0').member;
    const otherLane = addHorde('light', 'lane-1').member;
    const enemy = addHorde('dark', 'lane-0').member;

    lose('light', 'spawner-tower');
    system.update({ state, logger });
    lose('light', 'buff-tower');
    system.update({ state, logger });

    expect(stacksOf(mine)).toBe(2);
    expect(stacksOf(otherLane)).toBe(0);
    expect(stacksOf(enemy)).toBe(0);
    expect(state.teams.light.towersLostByLane).toEqual({ 'lane-0': 2 });
  });

  it('gives a horde spawned later on the lane the lane’s stacks', () => {
    const { state, system, addHorde, stacksOf, lose } = setUp();
    lose('light', 'spawner-tower');
    system.update({ state, logger });

    const { horde, member } = addHorde('light', 'lane-0');
    state.events.emit('horde-spawned', {
      hordeId: horde.id,
      lane: horde.lane,
      team: horde.team,
      memberIds: horde.memberIds,
    });
    system.update({ state, logger });

    expect(stacksOf(member)).toBe(1);
  });

  it('gives a horde that spawns in the same update as a loss exactly one stack per lost tower', () => {
    const { state, system, addHorde, stacksOf, lose } = setUp();
    lose('light', 'spawner-tower');
    const { horde, member } = addHorde('light', 'lane-0');
    state.events.emit('horde-spawned', {
      hordeId: horde.id,
      lane: horde.lane,
      team: horde.team,
      memberIds: horde.memberIds,
    });

    system.update({ state, logger });

    expect(stacksOf(member)).toBe(1);
  });

  it('ignores structures that do not enrage, structures off any lane and neutral ones', () => {
    const { state, system, addHorde, stacksOf, lose } = setUp();
    const mine = addHorde('light', 'lane-0').member;

    lose('light', 'gate');
    lose('light', 'spawner-tower', null);
    lose('neutral', 'spawner-tower');
    system.update({ state, logger });

    expect(stacksOf(mine)).toBe(0);
    expect(state.teams.light.towersLostByLane).toEqual({});
  });
});
