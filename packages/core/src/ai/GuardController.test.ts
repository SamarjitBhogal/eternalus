import { describe, expect, it } from 'vitest';

import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { AGGRO_RULES } from '../content/ai/aggro/aggroRules';
import { TOWER_GUARD_AGGRO } from '../content/ai/aggro/towerGuard';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../state/AiState.types';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { GameState } from '../state/GameState';
import { GuardController } from './GuardController';
import { Perception } from './perception/Perception';

const controller = new GuardController({
  aggro: AGGRO_RULES,
  classOf: (kind) => (kind === 'warrior' ? 'legend' : kind.endsWith('-mob') ? 'minion' : null),
});

/** A light guard posted at (60, 20) by a home of radius 10 at (50, 20), leash 8. */
const setUp = () => {
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
    definitionId = 'light-minion',
    kind = 'light-mob',
    y = 20,
  ) => {
    const entity = factory.create(kind, definitionId, { team, position: { x, y } });
    state.entities.add(entity);
    return entity.id;
  };
  /** Puts `guardId` on a new post at `postX` of the home `homeId` (same place and size). */
  const post = (guardId: string, homeId: string, postX: number) => {
    const index = state.guards.size;
    state.guards.add({
      id: `${homeId}:${String(index)}`,
      homeId,
      team: 'light',
      mobId: 'light-guard',
      row: 0,
      indexInRow: index,
      postX,
      postY: 20,
      homeX: 50,
      homeY: 20,
      homeRadius: 10,
      leashRadius: 8,
      leashTolerance: 2,
      respawnTicks: 3600,
    });
    state.guards.fill(index, guardId);
  };
  const guard = add('light', 60, 'light-guard');
  post(guard, 'home', 60);
  const moveTo = (entityId: string, x: number) => {
    const transform = state.entities.get(entityId)?.getComponent(Transform);
    transform?.moveBy({ x: x - transform.position.x, y: 0 });
  };
  const moveGuardTo = (x: number) => {
    moveTo(guard, x);
  };
  const decide = (memory: AiMemory = {}) => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
    return controller.decide({
      state,
      entityId: guard,
      perception,
      brain: {
        controllerId: 'guard',
        profileId: 'tower-guard',
        memory,
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });
  };
  return { state, guard, add, post, decide, moveTo, moveGuardTo };
};

describe('GuardController', () => {
  it('holding: attacks the nearest enemy that comes in range, and does nothing otherwise', () => {
    const { guard, add, decide } = setUp();
    expect(decide()).toMatchObject({ commands: [], memory: { fsm: 'holding' } });

    const enemy = add('dark', 64);

    expect(decide()).toMatchObject({
      commands: [{ type: 'attack-target', actorId: guard, targetId: enemy }],
      memory: { fsm: 'engaging', targetId: enemy },
    });
  });

  it('engaging: stops at once, with no grace, when its target leaves the circle around the structure’s edge (DEC-144 E)', () => {
    const { state, guard, add, decide, moveTo } = setUp();
    const enemy = add('dark', 68); // 8 past the edge at 60: still inside
    const engaging = { fsm: 'engaging', targetId: enemy, leashX: 64, leashY: 20 };
    moveTo(guard, 64);

    expect(decide(engaging).commands).toEqual([]);

    moveTo(enemy, 70);
    expect(decide(engaging)).toMatchObject({
      commands: [{ type: 'stop', actorId: guard }],
      memory: {
        fsm: 'holding',
        targetId: null,
        breakAtTick: 0,
        cooldownUntilTick: state.tick + TOWER_GUARD_AGGRO.aggroCooldownTicks,
        escapedId: enemy,
      },
    });
  });

  it('holding: never takes an enemy in reach that stands outside its circle (MS-36)', () => {
    const { add, decide, moveGuardTo } = setUp();
    moveGuardTo(66);
    add('dark', 70); // 4 from the guard, 10 past the edge

    expect(decide()).toMatchObject({ commands: [], memory: { fsm: 'holding' } });
  });

  it('engaging: fights a target inside its circle with no time limit, a Legend too (MS-36)', () => {
    for (const [definitionId, kind] of [
      ['light-minion', 'light-mob'],
      ['warrior', 'warrior'],
    ] as const) {
      const { state, add, decide } = setUp();
      const target = add('dark', 64, definitionId, kind);
      while (state.tick < 200) {
        state.advanceTick();
      }

      expect(decide({ fsm: 'engaging', targetId: target })).toMatchObject({
        commands: [],
        memory: { fsm: 'engaging', targetId: target },
      });
    }
  });

  it('reads a memory saved as `returning` (merged into holding, DEC-144 G) as holding off its post, keeping the cooldown fields LeashBehaviour carries (guard content sets the cooldown to 0)', () => {
    const { add, decide, moveGuardTo } = setUp();
    moveGuardTo(63);
    expect(decide({ fsm: 'returning' }).memory).toMatchObject({ fsm: 'holding' });

    const escaped = add('dark', 62, 'warrior', 'warrior');
    const cooling = { cooldownUntilTick: 10, escapedId: escaped };
    expect(decide({ fsm: 'returning', ...cooling }).memory).toEqual(
      expect.objectContaining({ fsm: 'holding', ...cooling }),
    );
    expect(decide({ fsm: 'holding', ...cooling }).commands).toEqual([]);
  });

  it('holding with a cooldown in memory (shared LeashBehaviour; 0 in guard content): still fights a minion in range (MS-36)', () => {
    const { guard, add, decide } = setUp();
    const escaped = add('dark', 62, 'warrior', 'warrior');
    const minion = add('dark', 63);

    expect(decide({ fsm: 'holding', cooldownUntilTick: 10, escapedId: escaped }).commands).toEqual([
      { type: 'attack-target', actorId: guard, targetId: minion },
    ]);
  });

  it('after a leash break: no rest, so it fights the escaped enemy at once when it comes back in (DEC-144)', () => {
    const { guard, add, decide, moveTo } = setUp();
    const enemy = add('dark', 70, 'warrior', 'warrior'); // 10 past the edge at 60: outside
    moveTo(guard, 64);
    const broken = decide({ fsm: 'engaging', targetId: enemy, leashX: 64, leashY: 20 });
    expect(broken.commands).toEqual([{ type: 'stop', actorId: guard }]);

    moveTo(enemy, 66);

    expect(decide(broken.memory).commands).toEqual([
      { type: 'attack-target', actorId: guard, targetId: enemy },
    ]);
  });

  it('answers a call for help: fights an enemy hitting a guard of its structure, anywhere in its circle (DEC-144)', () => {
    const { state, guard, add, post, decide } = setUp();
    const mate = add('light', 38, 'light-guard'); // the far side of the home (radius 10 at 50)
    post(mate, 'home', 38);
    const enemy = add('dark', 34); // 26 from the guard, 6 past the home's edge: inside
    state.entities.setAttackTarget(enemy, mate);

    expect(decide().commands).toEqual([{ type: 'attack-target', actorId: guard, targetId: enemy }]);
  });

  it('answers no call from outside its circle, or from a guard of another structure (DEC-144)', () => {
    const { state, add, post, decide } = setUp();
    const mate = add('light', 38, 'light-guard');
    post(mate, 'home', 38);
    // 9 past the home's edge, yet 21.5 from the guard: inside its help query, outside the circle.
    const outside = add('dark', 50, 'light-minion', 'light-mob', 39);
    state.entities.setAttackTarget(outside, mate);
    const stranger = add('light', 40, 'light-guard');
    post(stranger, 'other', 40);
    const enemy = add('dark', 36); // inside the circle
    state.entities.setAttackTarget(enemy, stranger);

    expect(decide().commands).toEqual([]);
  });

  it('does nothing for an entity on no post, and knows its profiles', () => {
    const { state, add } = setUp();
    const stray = add('light', 30);
    const decision = controller.decide({
      state,
      entityId: stray,
      perception: new Perception(state),
      brain: {
        controllerId: 'guard',
        profileId: 'tower-guard',
        memory: {},
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });

    expect(decision.commands).toEqual([]);
    expect(controller.hasProfile('tower-guard')).toBe(true);
    expect(controller.hasProfile('nope')).toBe(false);
  });

  it('throws on an aggro profile that does not exist', () => {
    const { state, guard } = setUp();

    expect(() =>
      controller.decide({
        state,
        entityId: guard,
        perception: new Perception(state),
        brain: {
          controllerId: 'guard',
          profileId: 'nope',
          memory: {},
          rngState: { seed: 1, words: [1, 2, 3, 4] as const },
        },
      }),
    ).toThrow('names aggro profile "nope"');
  });
});
