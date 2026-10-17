import { describe, expect, it } from 'vitest';

import { Movement } from '../components/Movement';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { PathingSystem } from './PathingSystem';

const logger = new NullLogger();
const FORMATIONS = { ranks: RANKS_FORMATION };
const STRATEGIES = createDefaultStrategyRegistry().movement;

describe('PathingSystem', () => {
  it('sends the leader to the anchor and each member to its rank and file behind it', () => {
    const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const { slotSpacing, ranksWidth } = RANKS_FORMATION;
    // Light on lane-0 walks +x along y 20; the anchor is 40 m in, at (60, 20).
    const backRight = { x: 60 - slotSpacing, y: 20 + ((ranksWidth - 1) / 2) * slotSpacing };
    const add = (x: number, y: number) => {
      const entity = factory.create('light-mob', 'light-minion', {
        team: 'light',
        position: { x, y },
      });
      state.entities.add(entity);
      return entity;
    };
    // Created in slot order (ids ascend): the leader behind the anchor, ranksWidth − 1 members far
    // away filling the first rank, then `member`, which takes its last file, off to the side.
    const leader = add(50, 20);
    const fillers = Array.from({ length: ranksWidth - 1 }, (_, index) => add(0, 59 - index * 5).id);
    const member = add(backRight.x, 30);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [leader.id, ...fillers, member.id],
      progress: 40,
    });
    const system = new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.separationRadius);

    system.update({ state, logger });
    // A second tick reuses the grown buffers.
    system.update({ state, logger });

    expect(leader.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });
    expect(member.getComponent(Movement).heading).toEqual({ x: 0, y: -1 });
  });

  it('does nothing without a map, without hordes or with an unknown formation', () => {
    const system = new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.separationRadius);
    const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'wedge',
      memberIds: ['entity-1'],
      progress: 0,
    });

    expect(() => {
      system.update({ state: new GameState(createDefaultGameConfig(), 1), logger });
      system.update({ state: new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP), logger });
      system.update({ state, logger });
    }).not.toThrow();
  });
});
