import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { BOT_DIFFICULTIES } from '../content/ai/difficulties/botDifficulties';
import { ROVER_BOT } from '../content/ai/difficulties/rover';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { ROVER_TACTICS } from '../content/ai/rover';
import { unitClassOf } from '../content/ai/unitClasses';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { Perception } from './perception/Perception';
import { RoverController } from './RoverController';

const RNG = { seed: 1, words: [1, 2, 3, 4] as const };
const controller = new RoverController({
  difficulties: { ...BOT_DIFFICULTIES, rover: { ...ROVER_BOT, abilityUseChance: 0 } },
  retreatTo: RETREAT_STRUCTURES,
  tactics: ROVER_TACTICS,
  classOf: unitClassOf,
  laneWeights: LANE_ASSESSMENT_WEIGHTS,
});

/** A dark Rover on the two-lane map (lane-0 along y 20, lane-1 along y 40, x 20 to 180). */
const setUp = (at = { x: 100, y: 30 }) => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP, space);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const perception = new Perception(state);
  const add = (team: 'light' | 'dark', x: number, y: number, kind = 'warrior') => {
    const entity = factory.create(kind, kind === 'warrior' ? 'warrior' : 'light-minion', {
      team,
      position: { x, y },
    });
    state.entities.add(entity);
    return entity.id;
  };
  const rover = add('dark', at.x, at.y);
  const decide = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
    return controller.decide({
      state,
      entityId: rover,
      perception,
      brain: { controllerId: 'rover', profileId: 'rover', memory: {}, rngState: RNG },
    });
  };
  const hurt = (id: string, fraction: number) => {
    const health = state.entities.get(id)?.getComponent(Health);
    health?.applyDamage((health.max * fraction) | 0);
  };
  return { state, add, rover, decide, hurt };
};

describe('RoverController (11 §4.7)', () => {
  it('Hunt: attacks the human when close and ahead on health', () => {
    const { add, rover, decide, hurt } = setUp();
    const human = add('light', 110, 30);
    hurt(human, 0.5);

    expect(decide().commands).toContainEqual({
      type: 'attack-target',
      actorId: rover,
      targetId: human,
    });
  });

  it('Mirror: goes to the human’s lane, at the point nearest the human, when not hunting', () => {
    const { add, rover, decide } = setUp({ x: 100, y: 30 });
    // Far beyond the engage radius, at full health: no hunt and no fight.
    add('light', 40, 42);

    // The nearest lane to (40, 42) is lane-1 along y 40: its point nearest the human is (40, 40).
    expect(decide().commands).toEqual([
      { type: 'move', actorId: rover, direction: { x: -60, y: 10 } },
    ]);
  });

  it('Defend: with no human in sight it holds the lane the assessment names', () => {
    const { rover, decide } = setUp({ x: 100, y: 30 });

    const [move] = decide().commands;
    expect(move).toMatchObject({ type: 'move', actorId: rover });
    // It heads onto a lane (y 20 or y 40), not along the map's middle.
    expect(move?.type === 'move' && Math.abs(move.direction.y)).toBe(10);
  });

  it('treats a Legend a controller drives as a bot, not the human', () => {
    // 18 m away: inside the hunt radius, outside the engage radius.
    const human = setUp();
    const target = human.add('light', 118, 30);
    human.hurt(target, 0.5);
    expect(human.decide().commands).toContainEqual({
      type: 'attack-target',
      actorId: human.rover,
      targetId: target,
    });

    const bot = setUp();
    const driven = bot.add('light', 118, 30);
    bot.hurt(driven, 0.5);
    bot.state.ai.set(driven, {
      controllerId: 'bot-legend',
      profileId: 'normal',
      memory: {},
      rngState: RNG,
    });
    expect(bot.decide().commands.some(({ type }) => type === 'attack-target')).toBe(false);
    expect(controller.hasProfile('rover')).toBe(true);
    expect(controller.hasProfile('nightmare')).toBe(false);
  });
});
