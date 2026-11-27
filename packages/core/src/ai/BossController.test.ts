import { describe, expect, it } from 'vitest';

import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { BOSS_PROFILES } from '../content/ai/bosses/bossProfiles';
import { GREATER_BOSS_PROFILE } from '../content/ai/bosses/greaterBoss';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../state/AiState.types';
import { GameState } from '../state/GameState';
import { TickRate } from '../utils/TickRate';
import { BossController } from './BossController';
import { Perception } from './perception/Perception';

const PROFILE = GREATER_BOSS_PROFILE;
const [SLAM] = PROFILE.moves;
const CONFIG = createDefaultGameConfig();
const ticks = (seconds: number): number => new TickRate(CONFIG.tickRate).toTicks(seconds);
/** The zone: home (100, 30) of radius 5 plus a leash of 20, so 25 m like the centre zone. */
const HOME = { x: 100, y: 30 };
const ZONE = 25;
const REACH = ZONE - PROFILE.zoneMargin;

const controller = new BossController(BOSS_PROFILES);

/** A Greater Boss on a post at `HOME`, at `bossX`; `add` places Warriors, `decide` decides. */
const setUp = (bossX = HOME.x) => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(CONFIG, 1, matchWorldOf(TWO_LANE_MAP), { space });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const perception = new Perception(state);
  const boss = factory.create('heavy-mob', 'greater-boss', {
    team: 'neutral',
    position: { x: bossX, y: HOME.y },
  });
  state.entities.add(boss);
  state.guards.add({
    id: 'cathedral:0',
    homeId: 'cathedral',
    team: 'neutral',
    mobId: 'greater-boss',
    row: 0,
    indexInRow: 0,
    postX: HOME.x,
    postY: HOME.y,
    homeX: HOME.x,
    homeY: HOME.y,
    homeRadius: 5,
    leashRadius: ZONE - 5,
    leashTolerance: 3,
    respawnTicks: 0,
    canLevel: false,
  });
  state.guards.fill(0, boss.id);
  const add = (x: number, y = HOME.y): string => {
    const warrior = factory.create('warrior', 'warrior', { team: 'light', position: { x, y } });
    state.entities.add(warrior);
    return warrior.id;
  };
  const decide = (memory: AiMemory = {}, entityId = boss.id, profileId: string = PROFILE.id) => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
    return controller.decide({
      state,
      entityId,
      perception,
      brain: {
        controllerId: 'boss',
        profileId,
        memory,
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });
  };
  const advance = (count: number): void => {
    for (let tick = 0; tick < count; tick += 1) state.advanceTick();
  };
  return { state, factory, boss: boss.id, add, decide, advance };
};

const gapFromHome = (memory: AiMemory): number =>
  Math.hypot(Number(memory.roamX) - HOME.x, Number(memory.roamY) - HOME.y);

describe('BossController', () => {
  it('knows only boss profiles, and stops on one it does not know (a content error)', () => {
    const { decide } = setUp();

    expect(controller.hasProfile(PROFILE.id)).toBe(true);
    expect(controller.hasProfile('tower-guard')).toBe(false);
    expect(() => decide({}, undefined, 'tower-guard')).toThrow('tower-guard');
  });

  it('decides nothing for a boss off a post', () => {
    const { state, factory, decide } = setUp();
    const stray = factory.create('heavy-mob', 'greater-boss', {
      team: 'neutral',
      position: { x: 20, y: 30 },
    });
    state.entities.add(stray);
    const memory = { fsm: 'roam' };

    expect(decide(memory, stray.id)).toMatchObject({ commands: [], memory });
  });

  it('starts with the entrance, standing still until it is over', () => {
    const { state, decide, advance } = setUp();
    const first = decide();

    expect(first).toMatchObject({
      commands: [],
      memory: { fsm: 'entrance', until: state.tick + ticks(PROFILE.entranceSeconds) },
    });
    advance(ticks(PROFILE.entranceSeconds) - 1);
    expect(decide(first.memory)).toMatchObject({ commands: [], memory: first.memory });
  });

  it('roams to a seeded point inside the zone, the margin in, once the entrance is over', () => {
    const { boss, decide } = setUp();
    const decision = decide({ fsm: 'entrance', until: 0 });
    const { commands, memory } = decision;
    const [move] = commands;
    const toward = {
      x: Number(memory.roamX) - HOME.x,
      y: Number(memory.roamY) - HOME.y,
    };
    const length = Math.hypot(toward.x, toward.y);

    expect(memory.fsm).toBe('roam');
    expect(gapFromHome(memory)).toBeLessThanOrEqual(REACH);
    expect(commands).toHaveLength(1);
    expect(move).toMatchObject({ type: 'move', actorId: boss });
    const direction = move?.type === 'move' ? move.direction : { x: NaN, y: NaN };
    expect(direction.x).toBeCloseTo(toward.x / length, 9);
    expect(direction.y).toBeCloseTo(toward.y / length, 9);
    // Seeded: the same brain decides the same.
    expect(decide({ fsm: 'entrance', until: 0 })).toEqual(decision);
  });

  it('keeps its roam point until it arrives or the roam cadence is up, then picks another', () => {
    const { state, boss, decide } = setUp();
    const far = { fsm: 'roam', roamX: HOME.x + 10, roamY: HOME.y, roamUntil: state.tick + 60 };

    expect(decide(far).memory).toMatchObject({ roamX: far.roamX, roamY: far.roamY });
    expect(decide(far).commands).toEqual([
      { type: 'move', actorId: boss, direction: { x: 1, y: 0 } },
    ]);
    const arrived = { ...far, roamX: HOME.x + PROFILE.roamArrivalRadius / 2 };
    expect(decide(arrived).memory.roamX).not.toBe(arrived.roamX);
    const due = { ...far, roamUntil: state.tick };
    expect(decide(due).memory.roamX).not.toBe(due.roamX);
  });

  it('telegraphs the move its tree picks, aimed at the target, when roaming', () => {
    const { state, boss, add, decide } = setUp();
    const warrior = add(HOME.x + SLAM.range - 0.5);
    const landTick = state.tick + 1 + ticks(SLAM.telegraphSeconds);
    // Every move but the slam cooling, so the tree has one move to pick.
    const cooling = Object.fromEntries(
      PROFILE.moves.filter(({ id }) => id !== SLAM.id).map(({ id }) => [`ready:${id}`, 10_000]),
    );

    expect(decide({ fsm: 'roam', ...cooling })).toMatchObject({
      commands: [{ type: 'boss-move', actorId: boss, moveId: SLAM.id, targetId: warrior }],
      memory: {
        fsm: 'telegraph',
        moveId: SLAM.id,
        until: landTick,
        [`ready:${SLAM.id}`]: landTick + ticks(SLAM.cooldownSeconds),
      },
    });
  });

  it('roams one decision before a move after the entrance or recovery, and waits for the cooldown', () => {
    const { state, add, decide } = setUp();
    add(HOME.x + SLAM.range - 0.5);
    const landTick = state.tick + 1 + ticks(SLAM.telegraphSeconds);

    for (const memory of [
      { fsm: 'recover', until: 0 },
      { fsm: 'entrance', until: 0 },
      {
        fsm: 'roam',
        // Every move one tick short of ready.
        ...Object.fromEntries(
          PROFILE.moves.map(({ id, telegraphSeconds }) => [
            `ready:${id}`,
            state.tick + 1 + ticks(telegraphSeconds) + 1,
          ]),
        ),
      },
    ]) {
      const decision = decide(memory);
      expect({
        from: memory.fsm,
        fsm: decision.memory.fsm,
        type: decision.commands[0]?.type,
      }).toEqual({
        from: memory.fsm,
        fsm: 'roam',
        type: 'move',
      });
    }
    expect(decide({ fsm: 'roam', [`ready:${SLAM.id}`]: landTick }).memory.fsm).toBe('telegraph');
  });

  it('walks toward the nearest target while no move of its tree is ready', () => {
    const { boss, add, decide } = setUp();
    add(HOME.x + 8);
    add(HOME.x - 12);
    const cooling = Object.fromEntries(PROFILE.moves.map(({ id }) => [`ready:${id}`, 10_000]));

    expect(decide({ fsm: 'roam', ...cooling }).commands).toEqual([
      { type: 'move', actorId: boss, direction: { x: 1, y: 0 } },
    ]);
  });

  it('chases a target in the zone but stops at the margin, and ignores one outside the zone', () => {
    const { boss, add, decide } = setUp(HOME.x + REACH + 1);
    add(HOME.x + ZONE - 0.5);

    // The target sits past the reach, so the boss heads back in to the clamped point (just out of
    // recovery, so it roams this decision rather than slam).
    expect(decide({ fsm: 'recover', until: 0 }).commands).toEqual([
      { type: 'move', actorId: boss, direction: { x: -1, y: 0 } },
    ]);

    const outside = setUp();
    outside.add(HOME.x + ZONE + 1);
    expect(gapFromHome(outside.decide({ fsm: 'roam' }).memory)).toBeLessThanOrEqual(REACH);
  });

  it('goes telegraph → execute → recover → roam, each on time', () => {
    const { decide } = setUp();
    const until = 40;

    expect(decide({ fsm: 'telegraph', moveId: SLAM.id, until: 1 }).memory.fsm).toBe('telegraph');
    const execute = decide({ fsm: 'telegraph', moveId: SLAM.id, until: 0 });
    expect(execute).toMatchObject({ commands: [], memory: { fsm: 'execute' } });
    expect(decide({ fsm: 'execute', moveId: SLAM.id, until })).toMatchObject({
      commands: [],
      memory: { fsm: 'recover', until: until + ticks(SLAM.recoverSeconds) },
    });
  });

  it('has every move start beyond the zone margin, so a clamped chase still reaches its target', () => {
    for (const profile of Object.values(BOSS_PROFILES)) {
      for (const move of profile.moves) {
        expect({ move: move.id, isBeyond: move.range > profile.zoneMargin }).toEqual({
          move: move.id,
          isBeyond: true,
        });
      }
    }
  });
});
