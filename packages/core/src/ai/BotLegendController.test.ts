import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { BOT_DIFFICULTIES } from '../content/ai/difficulties/botDifficulties';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { Unit } from '../entities/Unit';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../state/AiState.types';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { NO_PATH } from './BotLeaves.constants';
import { BotLegendController } from './BotLegendController';
import { Perception } from './perception/Perception';

/** The shipped difficulties, plus `normal` pinned to never and to always cast. */
const controller = new BotLegendController({
  difficulties: {
    ...BOT_DIFFICULTIES,
    'never-casts': { ...NORMAL_BOT, id: 'never-casts', abilityUseChance: 0 },
    'always-casts': { ...NORMAL_BOT, id: 'always-casts', abilityUseChance: 1 },
  },
  retreatTo: RETREAT_STRUCTURES,
});
const RNG = { seed: 1, words: [1, 2, 3, 4] as const };

/** A light Warrior laner on lane-0 (from x 20 to x 180 along y 20) of the two-lane map. */
const setUp = (at = { x: 60, y: 20 }) => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), { space });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const perception = new Perception(state);
  const add = (
    team: 'light' | 'dark',
    x: number,
    y = 20,
    kind = 'light-mob',
    id = 'light-minion',
  ) => {
    const entity = factory.create(kind, id, { team, position: { x, y } });
    state.entities.add(entity);
    return entity.id;
  };
  const bot = add('light', at.x, at.y, 'warrior', 'warrior');
  const decide = (memory: AiMemory = { lane: 'lane-0' }, profileId = 'normal') => {
    space.begin(state.entities.size);
    // Units only, as `SpaceSystem` indexes them: structures are never perceived as enemies.
    state.entities.forEach((entity) => {
      if (entity instanceof Unit) {
        const { x, y } = entity.getComponent(Transform).position;
        space.add(entity.id, x, y);
      }
    });
    space.commit();
    return controller.decide({
      state,
      entityId: bot,
      perception,
      brain: { controllerId: 'bot-legend', profileId, memory, rngState: RNG },
    });
  };
  const hurt = (fraction: number) => {
    const health = state.entities.get(bot)?.getComponent(Health);
    health?.applyDamage((health.max * fraction) | 0);
  };
  return { state, add, bot, decide, hurt };
};

describe('BotLegendController (laner tree, 11 §4.2)', () => {
  it('Survive: below the retreat line it drops its target and heads for the nearest allied tower', () => {
    const { bot, decide, hurt } = setUp({ x: 80, y: 20 });
    hurt(1 - NORMAL_BOT.retreatHealthFraction + 0.05);

    const decision = decide({ lane: 'lane-0', targetId: 'entity-9' });

    // The light SpawnerTower on lane-0 stands at (60, 20).
    expect(decision.commands).toEqual([
      { type: 'stop', actorId: bot },
      { type: 'move', actorId: bot, direction: { x: -20, y: 0 } },
    ]);
    // No pathfinder in this match, so nothing is cached.
    expect(decision.memory).toEqual({
      lane: 'lane-0',
      isRetreating: true,
      targetId: null,
      nextCastTick: 0,
      ...NO_PATH,
    });
  });

  it('Survive: of two equally near allied retreat points it takes the lower id', () => {
    // (55, 30) is as far from the BuffTower at (50, 40) as from the SpawnerTower at (60, 20).
    const { bot, decide, hurt } = setUp({ x: 55, y: 30 });
    hurt(1 - NORMAL_BOT.retreatHealthFraction + 0.05);

    expect(decide().commands).toEqual([
      { type: 'move', actorId: bot, direction: { x: -5, y: 10 } },
    ]);
  });

  it('Survive: keeps retreating until the rejoin line, then plays its lane again', () => {
    const { state, bot, decide, hurt } = setUp({ x: 80, y: 25 });
    hurt(0.5);

    const retreating = decide({ lane: 'lane-0', isRetreating: true });
    expect(retreating.memory).toMatchObject({ isRetreating: true });
    // Back to the light SpawnerTower at (60, 20).
    expect(retreating.commands).toEqual([
      { type: 'move', actorId: bot, direction: { x: -20, y: -5 } },
    ]);
    state.entities.get(bot)?.getComponent(Health).heal(1e6);
    const returning = decide({ lane: 'lane-0', isRetreating: true });
    expect(returning.memory).toMatchObject({ isRetreating: false });
    // No allied horde on the lane: back to the nearest point of the lane, (80, 20).
    expect(returning.commands).toEqual([
      { type: 'move', actorId: bot, direction: { x: 0, y: -5 } },
    ]);
  });

  it('Fight: attacks the enemy the scorer likes best and closes in, stopping in reach', () => {
    const { state, bot, add, decide } = setUp();
    const far = add('dark', 70);
    const near = add('dark', 64);
    state.entities.get(far)?.getComponent(Health).applyDamage(1);

    const decision = decide({ lane: 'lane-0' }, 'never-casts');
    expect(decision.commands).toEqual([
      { type: 'attack-target', actorId: bot, targetId: near },
      { type: 'move', actorId: bot, direction: { x: 4, y: 0 } },
    ]);
    expect(decision.memory).toMatchObject({ targetId: near });

    state.entities.get(near)?.getComponent(Transform).moveTo({ x: 61, y: 20 });
    expect(decide({ lane: 'lane-0', targetId: near }, 'never-casts').commands).toEqual([
      { type: 'move', actorId: bot, direction: { x: 0, y: 0 } },
    ]);
  });

  it('Fight: casts at its enemy when the roll comes up, then waits out the cast interval', () => {
    const { state, bot, add, decide } = setUp();
    const enemy = add('dark', 64);

    const decision = decide({ lane: 'lane-0', targetId: enemy }, 'always-casts');
    expect(decision.commands).toContainEqual({
      type: 'cast-ability',
      actorId: bot,
      slot: 'ability-1',
      aim: { point: { x: 64, y: 20 }, targetId: enemy },
    });
    expect(decision.memory).toMatchObject({
      nextCastTick: state.tick + NORMAL_BOT.castIntervalTicks,
    });
    expect(decision.rngState).not.toEqual(RNG);
    const waiting = decide(
      { lane: 'lane-0', targetId: enemy, nextCastTick: state.tick + 1 },
      'always-casts',
    );
    expect(waiting.commands.some(({ type }) => type === 'cast-ability')).toBe(false);
  });

  it('Push: walks with the most advanced allied horde on its lane', () => {
    const { state, bot, add, decide } = setUp({ x: 30, y: 20 });
    for (const [id, progress] of [
      ['horde-1', 20],
      ['horde-2', 50],
    ] as const) {
      state.hordes.add({
        id,
        team: 'light',
        weightClass: 'light',
        lane: 'lane-0',
        formationId: 'ranks',
        memberIds: [add('light', 5, 5)],
        progress,
      });
    }

    expect(decide().commands).toEqual([{ type: 'move', actorId: bot, direction: { x: 40, y: 0 } }]);
  });

  // Dark's lane-0 SpawnerTower stands at x 140, radius 14: hordes gather at its near edge, x 126.
  const nextTower = (state: GameState) =>
    state.laneStructures.objectiveFor('lane-0', 'light', state.entities)?.id ?? '';

  it('Push: at its lane’s next enemy structure it attacks it, walks up to it, then holds in reach', () => {
    const { state, bot, decide } = setUp({ x: 116, y: 20 });
    spawnMapStructures(state);
    const tower = nextTower(state);

    expect(decide().commands).toEqual([
      { type: 'attack-target', actorId: bot, targetId: tower },
      { type: 'move', actorId: bot, direction: { x: 10, y: 0 } },
    ]);
    state.entities.get(bot)?.getComponent(Transform).moveTo({ x: 125.5, y: 20 });
    expect(decide({ lane: 'lane-0', targetId: tower }).commands).toEqual([
      { type: 'move', actorId: bot, direction: { x: 0, y: 0 } },
    ]);
  });

  it('Fight before Push: an enemy unit near the structure is fought first', () => {
    const { state, bot, add, decide } = setUp({ x: 116, y: 20 });
    spawnMapStructures(state);
    const enemy = add('dark', 119);

    expect(decide().commands[0]).toEqual({ type: 'attack-target', actorId: bot, targetId: enemy });
  });

  it('Push: walks with its horde while still short of the structure', () => {
    const { state, bot, add, decide } = setUp({ x: 30, y: 20 });
    spawnMapStructures(state);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [add('light', 5, 5)],
      progress: 50,
    });

    expect(decide().commands).toEqual([{ type: 'move', actorId: bot, direction: { x: 40, y: 0 } }]);
  });

  it('Push: leaves a structure that cannot be broken yet alone', () => {
    const { state, bot, decide } = setUp({ x: 116, y: 20 });
    spawnMapStructures(state);
    state.entities.get(nextTower(state))?.getComponent(Collider).setUnbreakable(true);

    // With no horde on its lane it regroups on the lane, where it already stands.
    expect(decide().commands).toEqual([{ type: 'move', actorId: bot, direction: { x: 0, y: 0 } }]);
  });

  it('Regroup: with no allied horde on its lane it returns to the lane, halting once there', () => {
    const { bot, decide } = setUp({ x: 30, y: 26 });

    expect(decide().commands).toEqual([{ type: 'move', actorId: bot, direction: { x: 0, y: -6 } }]);
    expect(setUp({ x: 30, y: 21 }).decide().commands).toEqual([
      { type: 'move', actorId: 'entity-1', direction: { x: 0, y: 0 } },
    ]);
  });

  it('does nothing without a lane or an index, and throws on a difficulty that does not exist', () => {
    const { decide } = setUp({ x: 30, y: 20 });

    expect(decide({}).commands).toEqual([]);
    expect(controller.hasProfile('normal')).toBe(true);
    expect(controller.hasProfile('nightmare')).toBe(false);
    expect(() => decide({ lane: 'lane-0' }, 'nightmare')).toThrow('difficulty "nightmare"');
    const offMap = new GameState(createDefaultGameConfig(), 1);
    expect(
      controller.decide({
        state: offMap,
        entityId: 'entity-1',
        perception: new Perception(offMap),
        brain: { controllerId: 'bot-legend', profileId: 'normal', memory: {}, rngState: RNG },
      }).commands,
    ).toEqual([]);
  });
});
