import { describe, expect, it } from 'vitest';

import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { LaneFlowFields } from '../map/LaneFlowFields';
import { WorldMap } from '../map/WorldMap';
import { SpaceIndex } from '../physics/SpaceIndex';
import { GameState } from '../state/GameState';
import { PathingSystem } from './PathingSystem';

const logger = new NullLogger();
const FORMATIONS = { ranks: RANKS_FORMATION };
const STRATEGIES = createDefaultStrategyRegistry().movement;

describe('PathingSystem', () => {
  it.each([
    ['', false],
    [', even when a member ahead of it is not indexed this tick', true],
  ])(
    'sends the leader to the anchor and each member to its rank and file behind it%s',
    (_, isFillerSkipped) => {
      const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
      const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP, { space });
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
      // away filling the first rank, then `member`, which takes the last file. It
      // stands half a file gap from that slot toward the lane, so a slot one file off pulls it away.
      const leader = add(50, 20);
      const fillers = Array.from(
        { length: ranksWidth - 1 },
        (_, index) => add(0, 59 - index * 5).id,
      );
      const member = add(backRight.x, backRight.y - slotSpacing / 2);
      state.hordes.add({
        id: 'horde-1',
        team: 'light',
        weightClass: 'light',
        lane: 'lane-0',
        formationId: 'ranks',
        memberIds: [leader.id, ...fillers, member.id],
        progress: 40,
      });
      const system = new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius);

      // Fill the index the way SpaceSystem does: every unit, in store order.
      space.begin(state.entities.size);
      state.entities.forEach((entity) => {
        if (isFillerSkipped && entity.id === fillers[0]) {
          return;
        }
        const { x, y } = entity.getComponent(Transform).position;
        space.add(entity.id, x, y);
      });
      space.commit();
      system.update({ state, logger });
      // A second tick reuses the grown scratch.
      system.update({ state, logger });

      expect(leader.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });
      expect(member.getComponent(Movement).heading).toEqual({ x: 0, y: 1 });
    },
  );

  it('chases a member’s attack target instead of its slot, and stops at attack reach', () => {
    const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
    const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP, { space });
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 60, y: 20 },
    });
    const enemy = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 60, y: 30 },
    });
    state.entities.add(minion);
    state.entities.add(enemy);
    // The anchor (60, 20) is where the minion stands, so without a target it would not move.
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [minion.id],
      progress: 40,
    });
    state.entities.setAttackTarget(minion.id, enemy.id);
    const system = new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius);
    const index = () => {
      space.begin(state.entities.size);
      state.entities.forEach((entity) => {
        const { x, y } = entity.getComponent(Transform).position;
        space.add(entity.id, x, y);
      });
      space.commit();
    };

    index();
    system.update({ state, logger });
    expect(minion.getComponent(Movement).heading).toEqual({ x: 0, y: 1 });

    // Edge to edge 1.2 m apart: inside the 1.5 m reach, so it stops.
    enemy.getComponent(Transform).moveTo({ x: 60, y: 22 });
    index();
    system.update({ state, logger });
    expect(minion.getComponent(Movement).heading).toEqual({ x: 0, y: 0 });
  });

  describe('leaves every heading alone', () => {
    const setUpMember = (formationId: string, isMapped = true) => {
      const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
      const state = new GameState(createDefaultGameConfig(), 1, isMapped ? TWO_LANE_MAP : null, {
        space,
      });
      const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
      const minion = factory.create('light-mob', 'light-minion', {
        team: 'light',
        position: { x: 30, y: 30 },
      });
      state.entities.add(minion);
      state.hordes.add({
        id: 'horde-1',
        team: 'light',
        weightClass: 'light',
        lane: 'lane-0',
        formationId,
        memberIds: [minion.id],
        progress: 40,
      });
      space.begin(state.entities.size);
      space.add(minion.id, 30, 30);
      space.commit();
      return { state, heading: () => minion.getComponent(Movement).heading };
    };
    const system = new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius);

    it('for a horde whose formation is unknown', () => {
      const { state, heading } = setUpMember('wedge');
      system.update({ state, logger });
      expect(heading()).toEqual({ x: 0, y: 0 });
    });

    it('in a match without a map', () => {
      const { state, heading } = setUpMember('ranks', false);
      system.update({ state, logger });
      expect(heading()).toEqual({ x: 0, y: 0 });
    });

    it('for a unit outside any horde', () => {
      const { state, heading } = setUpMember('ranks');
      state.hordes.removeMember(state.hordes.get('horde-1')?.memberIds[0] ?? '');
      system.update({ state, logger });
      expect(heading()).toEqual({ x: 0, y: 0 });
    });
  });

  it('rebuilds dirty flow fields within the configured cell budget each tick', () => {
    const config = createDefaultGameConfig({ map: { flowFieldCellBudget: 10 } });
    const grid = WorldMap.fromDefinition(TWO_LANE_MAP, config.map.navCellSize, () => false);
    const fields = new LaneFlowFields(grid, TWO_LANE_MAP, config.map.flowFieldCorridorHalfWidth);
    const field = fields.fields[0];
    const system = new PathingSystem(
      STRATEGIES,
      FORMATIONS,
      HORDE_STEERING.slotArrivalRadius,
      fields,
    );
    const state = new GameState(config, 1, TWO_LANE_MAP);
    fields.markDirty([field?.goal ?? 0]);
    const serving = field?.integration;

    system.update({ state, logger });
    const isServingAfterOneTick = field?.integration === serving;
    for (let tick = 1; tick < Math.ceil((field?.cellCount ?? 0) / 10); tick += 1) {
      system.update({ state, logger });
    }

    expect(isServingAfterOneTick).toBe(true);
    expect(field?.integration).not.toBe(serving);
  });
});
