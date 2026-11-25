import { describe, expect, it } from 'vitest';
import { Capturable } from '../components/Capturable';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentValidationError } from '../content/ContentValidationError';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { CHECKPOINT_DEFENDER_LIMIT, CHECKPOINT_DEFENDERS } from '../content/structures/guardPlans';
import { CATHEDRAL_CAPTURE_POINT } from '../content/zones/cathedralCapturePoint';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { CapturePoint } from '../entities/zones/CapturePoint';
import type { GameEventMap } from '../state/GameEvents.types';
import type { GuardSlot } from '../state/GuardStore.types';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { Team } from '../teams/teams.types';
import { distance } from '../utils/geometry';
import { newSystem, NO_OPENING, TICK_RATE } from './__fixtures__/spawnSystemSetup';

const CENTER = { x: 100, y: 30 };
const HALF = 10;
const AREA = [
  [
    { x: CENTER.x - HALF, y: CENTER.y - HALF },
    { x: CENTER.x + HALF, y: CENTER.y - HALF },
    { x: CENTER.x + HALF, y: CENTER.y + HALF },
    { x: CENTER.x - HALF, y: CENTER.y + HALF },
  ],
];
const logger = new NullLogger();

/** A match with one capture point owned by `owner` and a SpawnSystem with the content's defenders. */
const setUp = (owner: Team, maxUnitsPerTeam?: number) => {
  const config = createDefaultGameConfig(
    maxUnitsPerTeam === undefined ? {} : { limits: { maxUnitsPerTeam } },
  );
  const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP));
  const point = new CapturePoint('zone-1', CATHEDRAL_CAPTURE_POINT.id);
  point.spawn({
    definition: CATHEDRAL_CAPTURE_POINT,
    position: CENTER,
    team: 'neutral',
    area: AREA,
  });
  point.getComponent(Capturable).setOwner(owner, state.tick);
  state.entities.add(point);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));
  const system = newSystem(state, factory, {
    openingWave: NO_OPENING,
    waves: {},
    defenders: CHECKPOINT_DEFENDERS,
  });
  const step = () => {
    system.update({ state, logger });
    state.advanceTick();
  };
  // `CaptureSystem` runs after `SpawnSystem`, so a checkpoint is reached at the end of a tick.
  const reach = (checkpoint: number, presentLegendIds: readonly string[] = ['legend-1']) => {
    state.events.emit('checkpoint-reached', {
      pointId: point.id,
      team: owner === 'light' ? 'dark' : 'light',
      checkpoint,
      presentLegendIds,
    });
    state.advanceTick();
  };
  const changeOwner = (to: Team) => {
    const from = point.getComponent(Capturable).setOwner(to, state.tick);
    state.events.emit('capture-point-owner-changed', { pointId: point.id, from, to });
    state.advanceTick();
  };
  const posts = () => {
    const all: GuardSlot[] = [];
    state.guards.forEach((slot) => all.push(slot));
    return all;
  };
  /** Kills post `slot`'s defender this tick, by `attackerId` (`null`: no known killer). */
  const kill = (slot: GuardSlot | undefined, attackerId: string | null = null) => {
    const entityId = slot?.guardId ?? '';
    state.events.emit('entity-died', {
      entityId,
      killer: { attackerId, kind: 'weapon', definitionId: 'test' },
    });
    // Left in the store, as `DeathSystem` removes it only after `SpawnSystem`'s pass.
    state.entities.get(entityId)?.getComponent(Health).applyDamage(1e6);
  };
  return { state, point, factory, step, reach, changeOwner, posts, kill };
};

describe('SpawnSystem', () => {
  describe('checkpoint defenders (07 §7, 18 §7.1)', () => {
    it("spawns each checkpoint's listed composition on its next pass", () => {
      const { state, step, reach, posts } = setUp('dark');
      reach(1);
      expect(state.guards.size).toBe(0);
      step();
      reach(2);
      step();

      const mobs = posts().map(({ mobId, guardId, canLevel }) => {
        expect(guardId).not.toBeNull();
        expect(canLevel).toBe(true); // DEC-260
        return mobId;
      });
      expect(mobs.sort()).toEqual(
        [
          ...Array<string>(4).fill('medium-assist-mob'),
          ...Array<string>(2).fill('heavy-assist-mob'),
          ...Array<string>(4).fill('light-assist-mob'),
        ].sort(),
      );
    });

    it('defends for the owner, and a point no team owns has neutral defenders (DEC-257)', () => {
      for (const owner of ['dark', 'neutral'] as const) {
        const { state, step, reach, posts } = setUp(owner);
        reach(1);
        step();
        expect(posts()).not.toHaveLength(0);
        for (const { team, guardId } of posts()) {
          expect(team).toBe(owner);
          expect(state.entities.teamOf(guardId ?? '')).toBe(owner);
        }
      }
    });

    it("leashes defenders to the zone's reach from its centre and posts them on its floor", () => {
      const { point, step, reach, posts } = setUp('light');
      reach(2);
      step();
      const zoneReach = point.getComponent(Transform).radius;
      const floor = point.getComponent(ZoneArea);
      for (const slot of posts()) {
        const post = { x: slot.postX, y: slot.postY };
        expect(slot.homeRadius).toBe(0);
        expect(slot.leashRadius).toBe(zoneReach);
        expect(distance(post, CENTER)).toBeLessThanOrEqual(zoneReach);
        expect(floor.contains(post)).toBe(true);
      }
    });

    it('never refills a dead defender', () => {
      const { state, step, reach, posts } = setUp('light');
      reach(1);
      step();
      const [first] = posts();
      state.entities.remove(first?.guardId ?? '', 'died');
      for (let tick = 0; tick < 10 * TICK_RATE; tick += 1) {
        step();
      }
      const after = posts()[0];
      expect(after?.guardId).toBeNull();
      expect(after?.respawnAtTick).toBeNull();
    });

    it('keeps the living defenders, on their own side, when the point changes owner (DEC-261)', () => {
      const { state, step, reach, changeOwner, posts } = setUp('neutral');
      const removed: string[] = [];
      state.events.on('entity-removed', ({ entityId }) => removed.push(entityId));
      reach(1);
      step();
      const ids = posts().map(({ guardId }) => guardId ?? '');
      changeOwner('light');
      for (let tick = 0; tick < 10 * TICK_RATE; tick += 1) {
        step();
      }

      expect(removed).toEqual([]);
      expect(ids.every((id) => state.entities.teamOf(id) === 'neutral')).toBe(true);
      expect(posts().map(({ guardId }) => guardId)).toEqual(ids);
    });

    it('gives each reach of a checkpoint its own posts, so ids never repeat', () => {
      const { step, reach, changeOwner, posts } = setUp('neutral');
      reach(1);
      step();
      changeOwner('light');
      step();
      reach(1);
      step();
      const ids = posts().map(({ id }) => id);
      expect(ids).toHaveLength(8);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('defends for the owner when the checkpoint was reached, even if the same pass took the point (DEC-257)', () => {
      const { state, step, reach, changeOwner, posts } = setUp('dark');
      reach(1);
      changeOwner('light');
      step();
      expect(posts()).not.toHaveLength(0);
      for (const { team, guardId } of posts()) {
        expect(team).toBe('dark');
        expect(state.entities.teamOf(guardId ?? '')).toBe('dark');
      }
    });

    it('adds nothing for a push with no Legend on the zone, such as a passing horde (DEC-259)', () => {
      const { state, step, reach } = setUp('neutral');
      reach(1, []);
      step();
      expect(state.guards.size).toBe(0);
    });

    it('adds nothing for a checkpoint with no defender row (checkpoint 3)', () => {
      const { state, step, reach } = setUp('light');
      reach(3);
      step();
      expect(state.guards.size).toBe(0);
    });

    it('rejects a defender row that names an unknown mob on a map with capture points', () => {
      const { state, factory } = setUp('light');
      const defenders = {
        1: {
          postGap: 2,
          leashTolerance: 5.5,
          canLevel: true,
          table: [{ mobId: 'nope', count: 1 }],
        },
      };
      const build = () =>
        newSystem(state, factory, {
          openingWave: NO_OPENING,
          defenders,
        });
      expect(build).toThrow(ContentValidationError);
      expect(build).toThrow(/checkpoint 1 defenders name unknown mob "nope"/);
    });

    it('does not check the defender rows on a map without capture points', () => {
      const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
      const factory = new EntityFactory(
        createDefaultEntityRegistry(),
        loadDefaultContent(TICK_RATE),
      );
      const defenders = {
        1: {
          postGap: 2,
          leashTolerance: 5.5,
          canLevel: true,
          table: [{ mobId: 'nope', count: 1 }],
        },
      };
      expect(() =>
        newSystem(state, factory, {
          openingWave: NO_OPENING,
          defenders,
        }),
      ).not.toThrow();
    });
  });

  describe('the defender limit per capture point (DEC-350)', () => {
    it('adds only the defenders that fit under the limit, in table order', () => {
      const { step, reach, changeOwner, posts, kill } = setUp('light');
      reach(1);
      step();
      reach(2);
      step();
      expect(posts()).toHaveLength(CHECKPOINT_DEFENDER_LIMIT);

      changeOwner('dark');
      reach(1);
      step();
      expect(posts()).toHaveLength(CHECKPOINT_DEFENDER_LIMIT);

      kill(posts()[0]);
      step();
      changeOwner('light');
      reach(2);
      step();
      const added = posts().slice(CHECKPOINT_DEFENDER_LIMIT);
      expect(added.map(({ mobId, team }) => [mobId, team])).toEqual([
        ['heavy-assist-mob', 'light'],
      ]);
    });

    it('counts the defenders waiting for room under the unit cap toward the limit', () => {
      const { step, reach, posts } = setUp('light', 1);
      reach(1);
      step();
      reach(2);
      step();
      expect(posts().filter(({ guardId }) => guardId !== null)).toHaveLength(1);
      expect(posts()).toHaveLength(CHECKPOINT_DEFENDER_LIMIT);

      reach(1);
      step();

      expect(posts()).toHaveLength(CHECKPOINT_DEFENDER_LIMIT);
    });

    it("cancels the old owner's waiting defenders when the point changes owner, and keeps its living one", () => {
      const { state, step, reach, changeOwner, posts } = setUp('light', 1);
      reach(1);
      step();
      const [living] = posts();
      changeOwner('dark');
      for (let tick = 0; tick < 10 * TICK_RATE; tick += 1) {
        step();
      }

      expect(posts()[0]?.guardId).toBe(living?.guardId);
      expect(state.entities.isAlive(living?.guardId ?? '')).toBe(true);
      for (const slot of posts().slice(1)) {
        expect([slot.guardId, slot.respawnAtTick]).toEqual([null, null]);
      }
    });
  });

  describe('checkpoint-cleared (07 §7)', () => {
    it('announces a set once, when its last defender is lost, naming the killer, its team and where it fell', () => {
      const { state, point, factory, step, reach, posts, kill } = setUp('neutral');
      const cleared: GameEventMap['checkpoint-cleared'][] = [];
      state.events.on('checkpoint-cleared', (payload) => cleared.push(payload));
      const killer = factory.create('light-mob', 'light-minion', {
        team: 'light',
        position: CENTER,
      });
      state.entities.add(killer);
      reach(1);
      step();
      const [last, ...rest] = posts();
      for (const slot of rest) {
        kill(slot);
      }
      step();
      expect(cleared).toEqual([]);

      const at = state.entities.get(last?.guardId ?? '')?.getComponent(Transform).position;
      kill(last, killer.id);
      step();

      expect(cleared).toEqual([
        {
          pointId: point.id,
          checkpoint: 1,
          defenceId: last?.defenceId,
          defendersTeam: 'neutral',
          team: 'light',
          killerId: killer.id,
          position: { x: at?.x, y: at?.y },
        },
      ]);
    });
  });
});
