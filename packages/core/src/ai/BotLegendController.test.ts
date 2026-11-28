import { describe, expect, it, vi } from 'vitest';
import { LANE_TOWER_FOOTPRINT_RADIUS } from '../content/maps/buildingGeometry';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { BOT_DIFFICULTIES } from '../content/ai/difficulties/botDifficulties';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { MapDefinition } from '../content/maps/maps.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { Unit } from '../entities/Unit';
import { AStarPathfinder } from '../map/AStarPathfinder';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../state/AiState.types';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import type { Team } from '../teams/teams.types';
import { BotLegendController } from './BotLegendController';
import { NO_PATH } from './BotMovement.constants';
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

const GLYPH = { shape: 'dot', size: 1, colourRole: 'team' } as const;

/**
 * One lane along y 100 from x 20 to x 160, and the dark Stronghold off its end at (240, 100)
 * behind a wall (x 170..180, y 0..150) with its way round at the top: the case where walking
 * straight at the Stronghold from the lane's end leans on the wall (B66-F1).
 */
const WALLED_STRONGHOLD_MAP: MapDefinition = {
  id: 'walled-stronghold',
  displayName: 'Walled Stronghold',
  width: 300,
  height: 200,
  seed: 1,
  lanes: [
    {
      id: 'lane-0',
      index: 0,
      path: [
        { x: 20, y: 100 },
        { x: 160, y: 100 },
      ],
    },
  ],
  terrain: [
    {
      id: 'wall',
      kind: 'rift',
      shape: [
        { x: 170, y: 0 },
        { x: 180, y: 0 },
        { x: 180, y: 150 },
        { x: 170, y: 150 },
      ],
    },
  ],
  features: [
    {
      id: 'stronghold-dark',
      kind: 'stronghold',
      team: 'dark',
      definitionId: 'stronghold',
      position: { x: 240, y: 100 },
      minimapGlyph: GLYPH,
    },
  ],
};

/** One decision's travel: a `move` holds a Warrior's 6 m/s top speed for the 6 ticks between. */
const STRIDE = 1.2;

/**
 * A light Warrior laner on lane-0 (on the two-lane map from x 20 to x 180 along y 20), with A\*
 * over the map's nav grid when `withPaths` is set.
 */
const setUp = (at = { x: 60, y: 20 }, map = TWO_LANE_MAP, withPaths = false) => {
  const config = createDefaultGameConfig();
  const space = new SpaceIndex(map.width, map.height, 2);
  const world = matchWorldOf(map);
  const paths = withPaths
    ? new AStarPathfinder(world.grid, {
        maxSearchArea: config.map.pathMaxSearchArea,
        snapCells: config.map.pathSnapCells,
      })
    : null;
  const state = new GameState(config, 1, world, { space, paths });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const perception = new Perception(state);
  const add = (team: Team, x: number, y = 20, kind = 'light-mob', id = 'light-minion') => {
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
    expect(decision.memory).toEqual({
      lane: 'lane-0',
      isRetreating: true,
      targetId: null,
      nextCastTick: 0,
      isHalted: false,
      // No pathfinder in this match, so nothing is cached.
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

  it('holds still in reach, or at its destination, without re-sending an idle move every decision (B66-F2)', () => {
    const { state, bot, add, decide } = setUp();
    const enemy = add('dark', 61);
    const halt = { type: 'move', actorId: bot, direction: { x: 0, y: 0 } };

    const holding = decide({ lane: 'lane-0', targetId: enemy }, 'never-casts');
    expect(holding.commands).toEqual([halt]);
    expect(decide(holding.memory, 'never-casts').commands).toEqual([]);
    // Moving again clears it, so the next halt is sent once more.
    state.entities.get(enemy)?.getComponent(Transform).moveTo({ x: 66, y: 20 });
    const closing = decide(holding.memory, 'never-casts');
    expect(closing.commands).toEqual([{ type: 'move', actorId: bot, direction: { x: 6, y: 0 } }]);
    state.entities.get(enemy)?.getComponent(Transform).moveTo({ x: 61, y: 20 });
    expect(decide(closing.memory, 'never-casts').commands).toEqual([halt]);

    // Regroup: on its lane, it halts once and then sends nothing.
    const regroup = setUp({ x: 30, y: 21 });
    const arrived = regroup.decide();
    expect(arrived.commands).toEqual([{ ...halt, actorId: regroup.bot }]);
    expect(regroup.decide(arrived.memory).commands).toEqual([]);
  });

  it('Fight: fights back against a camp mob that attacks it, and never farms one that leaves it alone (DEC-166)', () => {
    const { state, bot, add, decide } = setUp();
    const camp = add('neutral', 64, 20, 'light-mob', 'light-camp-mob');
    const attack = { type: 'attack-target', actorId: bot, targetId: camp };

    expect(decide({ lane: 'lane-0' }, 'never-casts').commands).not.toContainEqual(attack);

    state.entities.setAttackTarget(camp, bot);
    expect(decide({ lane: 'lane-0' }, 'never-casts').commands).toEqual([
      attack,
      { type: 'move', actorId: bot, direction: { x: 4, y: 0 } },
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

  // Dark's lane-0 SpawnerTower stands at x 140, its radius following its fort (DEC-315): hordes
  // gather at its near edge.
  const nearEdge = 140 - LANE_TOWER_FOOTPRINT_RADIUS;
  const nextTower = (state: GameState) =>
    state.laneStructures.objectiveFor('lane-0', 'light', state.entities)?.id ?? '';

  it('Push: at its lane’s next enemy structure it attacks it, walks up to it, then holds in reach', () => {
    const { state, bot, decide } = setUp({ x: nearEdge - 10, y: 20 });
    spawnMapStructures(state);
    const tower = nextTower(state);

    expect(decide().commands).toEqual([
      { type: 'attack-target', actorId: bot, targetId: tower },
      { type: 'move', actorId: bot, direction: { x: 10, y: 0 } },
    ]);
    state.entities
      .get(bot)
      ?.getComponent(Transform)
      .moveTo({ x: nearEdge - 0.5, y: 20 });
    expect(decide({ lane: 'lane-0', targetId: tower }).commands).toEqual([
      { type: 'move', actorId: bot, direction: { x: 0, y: 0 } },
    ]);
  });

  it('Push: walks round a wall to the Stronghold’s edge and into reach, rather than leaning on the wall from its lane’s end (B66-F1)', () => {
    const { state, bot, decide } = setUp({ x: 158, y: 100 }, WALLED_STRONGHOLD_MAP, true);
    spawnMapStructures(state);
    const stronghold = nextTower(state);
    const body = state.entities.get(bot)?.getComponent(Transform);
    let memory: AiMemory = { lane: 'lane-0' };
    let heading = { x: 0, y: 0 };
    // Walks as a held `move` drives it, blocked (not slid) by the wall, until it is in reach.
    for (let turn = 0; turn < 300 && !state.entities.isInReach(bot, stronghold); turn += 1) {
      const decision = decide(memory);
      memory = decision.memory;
      const move = decision.commands.findLast(({ type }) => type === 'move');
      if (move?.type === 'move') {
        const length = Math.hypot(move.direction.x, move.direction.y);
        heading =
          length === 0
            ? { x: 0, y: 0 }
            : { x: move.direction.x / length, y: move.direction.y / length };
      }
      const at = body?.position ?? { x: 0, y: 0 };
      const next = { x: at.x + heading.x * STRIDE, y: at.y + heading.y * STRIDE };
      if (state.world?.grid.isWalkableAt(next.x, next.y) === true) {
        body?.moveTo(next);
      }
    }

    expect(stronghold).toBe('entity-1001');
    expect(state.entities.isInReach(bot, stronghold)).toBe(true);
  });

  it('keeps its A* waypoint in brain memory and reuses it, searching again once the map changes (11 §6, DEC-379)', () => {
    // Beside the wall, south of the lane: the way round the wall's end is nearer than the
    // Stronghold, so the cached waypoint is still on the way (at x 158, y 100 it is not).
    const { state, decide } = setUp({ x: 160, y: 125 }, WALLED_STRONGHOLD_MAP, true);
    spawnMapStructures(state);
    const { paths } = state;
    if (paths === null) throw new Error('setUp gave no pathfinder');
    const search = vi.spyOn(paths, 'waypoint');

    const first = decide();
    const searched = search.mock.calls.length;
    expect(searched).toBeGreaterThan(0);
    expect(first.memory).toMatchObject({ pathVersion: paths.version });

    decide(first.memory);
    expect(search).toHaveBeenCalledTimes(searched);

    // Any stamp changes the map's version, even one far from the way.
    state.world?.grid.stampFootprint([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ]);
    decide(first.memory);
    expect(search).toHaveBeenCalledTimes(searched + 1);
  });

  it('Fight before Push: an enemy unit near the structure is fought first', () => {
    const { state, bot, add, decide } = setUp({ x: 116, y: 20 });
    spawnMapStructures(state);
    const enemy = add('dark', 119);

    expect(decide().commands[0]).toEqual({ type: 'attack-target', actorId: bot, targetId: enemy });
  });

  // Light's lane-0 SpawnerTower stands at (60, 20) in a fort box x 44..76, y 12..28. It is under
  // attack while an enemy unit within the engage radius of that box has it as its target
  // (DEC-323 (2)): out to x 94 along the lane.
  const FORT = { left: 44, right: 76, top: 12, bottom: 28 };
  const defendArea = FORT.right + NORMAL_BOT.engageRadius;
  const withFort = (state: GameState): void => {
    spawnMapStructures(state, [
      {
        id: 'spawner-light-0',
        kind: 'fort',
        isBlocking: true,
        footprints: [
          [
            { x: FORT.left, y: FORT.top },
            { x: FORT.right, y: FORT.top },
            { x: FORT.right, y: FORT.bottom },
            { x: FORT.left, y: FORT.bottom },
          ],
        ],
      },
    ]);
  };
  const ownTower = (state: GameState, lane = 'lane-0') =>
    state.laneStructures.onLane(lane, 'light')[0]?.id ?? '';

  it('Defend: goes back down its lane to fight an enemy attacking its own tower, rather than push the enemy one (DEC-323 (2))', () => {
    const { state, bot, add, decide } = setUp({ x: 130, y: 20 });
    withFort(state);
    // 40 m from the bot, beyond its engage radius; 30 m from its tower but 14 m from the fort box.
    const attacker = add('dark', 90);
    state.entities.setAttackTarget(attacker, ownTower(state));

    expect(decide({ lane: 'lane-0' }, 'never-casts').commands).toEqual([
      { type: 'attack-target', actorId: bot, targetId: attacker },
      { type: 'move', actorId: bot, direction: { x: -40, y: 0 } },
    ]);
  });

  it('Defend: leaves enemies by its tower alone while none attacks it there, and counts no tower on another lane (DEC-323 (2))', () => {
    const { state, bot, add, decide } = setUp({ x: 130, y: 20 });
    withFort(state);
    const tower = ownTower(state);
    const near = add('dark', 90);
    state.entities.setAttackTarget(near, add('light', 88));
    // Attacks the tower from 1 m beyond its area, and 35 m from the bot.
    state.entities.setAttackTarget(add('dark', defendArea + 1), tower);
    // Attacks light's lane-1 BuffTower at (50, 40), from inside the lane-0 tower's area.
    state.entities.setAttackTarget(add('dark', 50, FORT.bottom + 16), ownTower(state, 'lane-1'));

    expect(decide().commands[0]).toEqual({
      type: 'attack-target',
      actorId: bot,
      targetId: nextTower(state),
    });

    state.entities.setAttackTarget(near, tower);
    expect(decide().commands[0]).toEqual({ type: 'attack-target', actorId: bot, targetId: near });
  });

  /** The two-lane map with a second light BuffTower on lane-0 at `at`, under the feature id `id`. */
  const withSecondTower = (id: string, at: { readonly x: number; readonly y: number }) => ({
    ...TWO_LANE_MAP,
    features: [
      ...TWO_LANE_MAP.features,
      {
        id,
        kind: 'buff-tower',
        team: 'light',
        definitionId: 'buff-tower',
        position: at,
        minimapGlyph: GLYPH,
        laneId: 'lane-0',
      } as const,
    ],
  });
  const towerAt = (state: GameState, x: number, y = 20) =>
    state.laneStructures.onLane('lane-0', 'light').find((entry) => entry.x === x && entry.y === y)
      ?.id ?? '';

  // Feature ids sort into lane order: `buff-light-0` before `spawner-light-0`, `tower-light-0` after.
  it.each(['buff-light-0', 'tower-light-0'])(
    'Defend: of two of its structures under attack, defends the one nearer the bot (second tower %s, DEC-323 (2))',
    (id) => {
      const { state, bot, add, decide } = setUp(
        { x: 130, y: 20 },
        withSecondTower(id, { x: 25, y: 20 }),
      );
      withFort(state);
      // 15 m above the far tower, 20 m from the near tower's fort box: in the far tower's area only.
      // Nearly dead, so the scorer would take it if it were a candidate.
      const weak = add('dark', 25, 5);
      const health = state.entities.get(weak)?.getComponent(Health);
      health?.applyDamage(Math.floor(health.max * 0.9));
      state.entities.setAttackTarget(weak, towerAt(state, 25));
      const attacker = add('dark', 90);
      state.entities.setAttackTarget(attacker, towerAt(state, 60));

      expect(decide().commands[0]).toEqual({
        type: 'attack-target',
        actorId: bot,
        targetId: attacker,
      });
    },
  );

  it('Defend: of two attacked structures as near the bot, defends the earlier in lane order (DEC-323 (2))', () => {
    // The bot at (110, 30) is 50 m across and 10 m down from both the SpawnerTower at (60, 20) and
    // a second tower at (60, 40), which comes later in lane order.
    const { state, bot, add, decide } = setUp(
      { x: 110, y: 30 },
      withSecondTower('tower-light-0', { x: 60, y: 40 }),
    );
    withFort(state);
    // 12 m above the fort box, 40 m from the second tower: in the SpawnerTower's area only.
    const attacker = add('dark', 60, 0);
    state.entities.setAttackTarget(attacker, towerAt(state, 60));
    // 16 m below the second tower, 28 m below the fort box, and nearer the bot than `attacker`.
    state.entities.setAttackTarget(add('dark', 60, 56), towerAt(state, 60, 40));

    expect(decide().commands[0]).toEqual({
      type: 'attack-target',
      actorId: bot,
      targetId: attacker,
    });
  });

  it('Defend: counts no fallen tower, though an enemy still has it as its target (DEC-323 (2))', () => {
    const { state, bot, add, decide } = setUp({ x: 130, y: 20 });
    withFort(state);
    const tower = ownTower(state);
    // `CombatSystem` drops a dead target only when it next runs, after the bots decide.
    state.entities.setAttackTarget(add('dark', 90), tower);
    const health = state.entities.get(tower)?.getComponent(Health);
    health?.applyDamage(health.total);

    expect(decide().commands[0]).toEqual({
      type: 'attack-target',
      actorId: bot,
      targetId: nextTower(state),
    });
  });

  it('Fight before Defend: an enemy inside its engage radius is fought first, while its tower is attacked', () => {
    const { state, bot, add, decide } = setUp({ x: 130, y: 20 });
    withFort(state);
    state.entities.setAttackTarget(add('dark', 90), ownTower(state));
    const close = add('dark', 135);

    expect(decide().commands[0]).toEqual({ type: 'attack-target', actorId: bot, targetId: close });
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
