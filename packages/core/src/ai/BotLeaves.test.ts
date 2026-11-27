import { describe, expect, it } from 'vitest';

import { ChaseWatch } from '../components/ChaseWatch';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { Entity } from '../entities/Entity';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { AStarPathfinder } from '../map/AStarPathfinder';
import { SpaceIndex } from '../physics/SpaceIndex';
import type { PathQuery } from '../state/PathQuery.types';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { SeededRandom } from '../utils/SeededRandom';
import type { BotTurn } from './BotLegendController.types';
import { BotLeaves } from './BotLeaves';
import { allReady } from '../state/__fixtures__/stubReadiness';
import { NO_PATH } from './BotMovement.constants';
import { Perception } from './perception/Perception';
import { SHIPPED_LINE_OF_FIRE } from '../state/__fixtures__/shippedLineOfFire';

const leaves = new BotLeaves({
  difficulties: { normal: NORMAL_BOT },
  retreatTo: RETREAT_STRUCTURES,
  readiness: allReady,
  lineOfFire: SHIPPED_LINE_OF_FIRE,
});

/** A pathfinder stub: past x 50 it leads via (60, 34), otherwise straight to the goal. */
const STUB_PATHS: PathQuery = {
  waypoint: (_start, goal, out) => {
    const isBlocked = goal.x > 50;
    out.x = isBlocked ? 60 : goal.x;
    out.y = isBlocked ? 34 : goal.y;
    return true;
  },
  // Blocked past x 50, except the line to the stub's own waypoint.
  isLineClear: (_start, end) => end.x <= 50 || (end.x === 60 && end.y === 34),
};

/** A pathfinder stub that never finds a way. */
const NO_WAY: PathQuery = { waypoint: () => false, isLineClear: () => false };

/** A turn for a bot at `position` on the blocked-lane map, with or without pathfinding. */
const turnAt = (
  position: { x: number; y: number },
  withPaths: boolean,
  paths: PathQuery = STUB_PATHS,
): BotTurn => {
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(BLOCKED_LANE_MAP), {
    paths: withPaths ? paths : null,
  });
  const memory = {
    lane: 'lane-0',
    isRetreating: false,
    targetId: null,
    nextCastTick: 0,
    isHalted: false,
    ...NO_PATH,
  };
  return {
    state,
    id: 'bot',
    team: 'light',
    position,
    difficulty: NORMAL_BOT,
    perception: new Perception(state),
    rng: new SeededRandom(1),
    memory,
    next: memory,
    commands: [],
    enemy: null,
    objective: null,
    destination: null,
  };
};

/** A bot Legend stand-in that `StuckSystem` found stuck and sent toward (47.5, 32.5). */
class StuckBot extends Entity {
  public readonly kind = 'warrior';
  public readonly family = 'legend';
  protected installComponents(): void {
    const watch = new ChaseWatch();
    watch.headFor(47.5, 32.5, 13, 0);
    this.addComponent(watch);
  }
}

describe('BotLeaves.moveTo (A* for Legends, 10 §9)', () => {
  it('heads for the pathfinder’s waypoint when it gives one', () => {
    const turn = turnAt({ x: 40, y: 20 }, true);

    leaves.moveTo(turn, { x: 80, y: 20 });

    expect(turn.commands).toEqual([{ type: 'move', actorId: 'bot', direction: { x: 20, y: 14 } }]);
  });

  it('walks straight when the line is clear, or when the match has no pathfinding', () => {
    const clear = turnAt({ x: 40, y: 20 }, true);
    leaves.moveTo(clear, { x: 45, y: 20 });
    const blind = turnAt({ x: 40, y: 20 }, false);
    leaves.moveTo(blind, { x: 80, y: 20 });

    expect(clear.commands).toEqual([{ type: 'move', actorId: 'bot', direction: { x: 5, y: 0 } }]);
    expect(blind.commands).toEqual([{ type: 'move', actorId: 'bot', direction: { x: 40, y: 0 } }]);
  });

  it('stops and fails when the pathfinder finds no way, rather than leaning on the obstruction', () => {
    const turn = turnAt({ x: 40, y: 20 }, true, NO_WAY);

    expect(leaves.moveTo(turn, { x: 80, y: 20 })).toBe('failure');
    expect(turn.commands).toEqual([{ type: 'stop', actorId: 'bot' }]);
  });

  it('halts at the near edge of blocked ground it is sent into, instead of turning back and forth at the cell A* snaps to (playtest 2026-11-04)', () => {
    // The rift block (x 50..70, y 10..30) stands in for a tower footprint; its middle for the
    // tower's centre, the point a retreating bot is sent to.
    const world = matchWorldOf(BLOCKED_LANE_MAP);
    const { pathMaxSearchArea, pathSnapCells } = createDefaultGameConfig().map;
    const state = new GameState(createDefaultGameConfig(), 1, world, {
      paths: new AStarPathfinder(world.grid, {
        maxSearchArea: pathMaxSearchArea,
        snapCells: pathSnapCells,
      }),
    });
    // One decision's travel: a `move` holds a Warrior's 6 m/s top speed for 6 ticks.
    const STRIDE = 1.2;
    let position = { x: 30, y: 20 };
    let memory = turnAt(position, true).memory;
    const headings: { x: number; y: number }[] = [];
    for (let decision = 0; decision < 120; decision += 1) {
      const turn = { ...turnAt(position, true), state, position, memory, next: memory };
      leaves.moveTo(turn, { x: 60, y: 20 });
      const move = turn.commands.find((command) => command.type === 'move');
      if (move !== undefined) {
        const { x, y } = move.direction;
        const length = Math.hypot(x, y);
        headings.push(length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length });
      }
      const heading = headings.at(-1) ?? { x: 0, y: 0 };
      position = { x: position.x + heading.x * STRIDE, y: position.y + heading.y * STRIDE };
      memory = turn.next;
    }

    const reversals = headings.filter((heading, index) => {
      const before = headings[index - 1];
      return before !== undefined && heading.x * before.x + heading.y * before.y < 0;
    });
    expect(reversals).toEqual([]);
    expect(headings.at(-1)).toEqual({ x: 0, y: 0 });
    // Standing on open ground in front of the block, on the bot's side of it.
    expect(position.x).toBeGreaterThan(43);
    expect(position.x).toBeLessThan(50);
  });

  it('steps in from the edge of blocked ground toward an enemy or tower on it, and keeps stepping in once inside it, instead of halting or walking back out (DEC-189)', () => {
    // The rift block (x 50..70, y 10..30) stands in for a fort's court, which the nav grid blocks
    // though its doorways let a body in; the collision system stops the bot at real walls.
    const world = matchWorldOf(BLOCKED_LANE_MAP);
    const { pathMaxSearchArea, pathSnapCells } = createDefaultGameConfig().map;
    const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
    space.begin(1);
    space.add('enemy', 55, 20);
    space.commit();
    const state = new GameState(createDefaultGameConfig(), 1, world, {
      space,
      paths: new AStarPathfinder(world.grid, {
        maxSearchArea: pathMaxSearchArea,
        snapCells: pathSnapCells,
      }),
    });
    const at = (position: { x: number; y: number }): BotTurn => ({
      ...turnAt(position, true),
      state,
    });
    const lastMove = (turn: BotTurn) =>
      turn.commands.filter((command) => command.type === 'move').at(-1)?.direction;
    const fighter = { ...at({ x: 46, y: 20 }), enemy: 'enemy' };
    const sieger = {
      ...at({ x: 52, y: 20 }),
      objective: {
        id: 'tower',
        kind: 'spawner-tower',
        team: 'dark' as const,
        lane: 'lane-0',
        x: 60,
        y: 20,
        radius: 5,
        startingHealth: 3000,
        progress: 60,
        frontProgress: 55,
        isBreakable: true,
      },
    };

    // At the open edge in front of the enemy: on toward it, not a halt.
    expect(leaves.fight(fighter)).toBe('running');
    expect(lastMove(fighter)).toEqual({ x: 9, y: 0 });
    // Already inside the blocked ground: on toward the tower, not back out along A*.
    expect(leaves.siege(sieger)).toBe('running');
    expect(lastMove(sieger)).toEqual({ x: 8, y: 0 });
  });

  it('forgets the remembered target when the pathfinder finds no way, since the stop cleared it', () => {
    const turn = { ...turnAt({ x: 40, y: 20 }, true, NO_WAY) };
    turn.next = { ...turn.next, targetId: 'enemy' };

    leaves.moveTo(turn, { x: 80, y: 20 });

    expect(turn.next.targetId).toBeNull();
    expect(turn.next.lane).toBe('lane-0');
  });

  it('heads for its detour waypoint when stuck on the way, in a fight and a siege, instead of pressing on (DEC-193)', () => {
    const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
    space.begin(1);
    space.add('enemy', 80, 20);
    space.commit();
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(BLOCKED_LANE_MAP), {
      space,
      paths: STUB_PATHS,
    });
    const bot = new StuckBot('bot', 'warrior');
    bot.spawn({});
    state.entities.add(bot);
    const at = (position: { x: number; y: number }): BotTurn => ({
      ...turnAt(position, true),
      state,
    });
    const lastMove = (turn: BotTurn) =>
      turn.commands.filter((command) => command.type === 'move').at(-1)?.direction;
    const fighter = { ...at({ x: 46, y: 20 }), enemy: 'enemy' };
    const sieger = {
      ...at({ x: 46, y: 20 }),
      objective: {
        id: 'tower',
        kind: 'spawner-tower',
        team: 'dark' as const,
        lane: 'lane-0',
        x: 60,
        y: 20,
        radius: 5,
        startingHealth: 3000,
        progress: 60,
        frontProgress: 55,
        isBreakable: true,
      },
    };

    expect(leaves.fight(fighter)).toBe('running');
    expect(lastMove(fighter)).toEqual({ x: 1.5, y: 12.5 });
    expect(leaves.siege(sieger)).toBe('running');
    expect(lastMove(sieger)).toEqual({ x: 1.5, y: 12.5 });
  });
});

describe('BotLeaves.moveTo path cache (11 §6)', () => {
  /** A stub that counts searches; `isClear: false` blocks every straight line. */
  const counting = (isClear = true) => {
    const calls = { searches: 0 };
    const paths: PathQuery = {
      waypoint: (start, goal, out) => {
        calls.searches += 1;
        return STUB_PATHS.waypoint(start, goal, out);
      },
      isLineClear: (start, end) => isClear && STUB_PATHS.isLineClear(start, end),
    };
    return { calls, paths };
  };

  /** Runs `moveTo` from `position` toward `destination`, carrying `memory` from a previous turn. */
  const decide = (
    paths: PathQuery,
    position: { x: number; y: number },
    destination: { x: number; y: number },
    memory?: BotTurn['memory'],
    brain: BotLeaves = leaves,
  ) => {
    const base = turnAt(position, true, paths);
    const turn = memory === undefined ? base : { ...base, memory, next: memory };
    brain.moveTo(turn, destination);
    return turn;
  };

  it('remembers the search’s destination and waypoint, then reuses them without a new search', () => {
    const { calls, paths } = counting();
    const first = decide(paths, { x: 40, y: 20 }, { x: 80, y: 20 });
    expect(first.next).toMatchObject({
      pathGoalX: 80,
      pathGoalY: 20,
      pathStepX: 60,
      pathStepY: 34,
    });

    // A fresh brain: the waypoint must come from memory, not from a scratch vector left over.
    const fresh = new BotLeaves({
      difficulties: { normal: NORMAL_BOT },
      retreatTo: RETREAT_STRUCTURES,
      readiness: allReady,
      lineOfFire: SHIPPED_LINE_OF_FIRE,
    });
    const second = decide(paths, { x: 42, y: 21 }, { x: 81, y: 20 }, first.next, fresh);

    expect(calls.searches).toBe(1);
    expect(second.commands).toEqual([
      { type: 'move', actorId: 'bot', direction: { x: 18, y: 13 } },
    ]);
  });

  it('searches again when the destination moved past arrivalDistance', () => {
    const { calls, paths } = counting();
    const first = decide(paths, { x: 40, y: 20 }, { x: 80, y: 20 });
    decide(paths, { x: 42, y: 21 }, { x: 80, y: 20 + NORMAL_BOT.arrivalDistance + 1 }, first.next);
    expect(calls.searches).toBe(2);
  });

  it('searches again once the waypoint is reached', () => {
    const { calls, paths } = counting();
    const first = decide(paths, { x: 40, y: 20 }, { x: 80, y: 20 });
    decide(paths, { x: 60, y: 33 }, { x: 80, y: 20 }, first.next);
    expect(calls.searches).toBe(2);
  });

  it('searches again when the straight line to the waypoint is blocked', () => {
    const { calls, paths } = counting(false);
    const first = decide(paths, { x: 40, y: 20 }, { x: 80, y: 20 });
    decide(paths, { x: 42, y: 21 }, { x: 80, y: 20 }, first.next);
    expect(calls.searches).toBe(2);
  });

  it('forgets the path when no way is found', () => {
    const { paths } = counting();
    const first = decide(paths, { x: 40, y: 20 }, { x: 80, y: 20 });
    const lost = decide(NO_WAY, { x: 40, y: 20 }, { x: 10, y: 90 }, first.next);
    expect(lost.next).toMatchObject(NO_PATH);
  });

  it('caches nothing when the line is clear, so a moving destination is followed where it is now', () => {
    const { calls, paths } = counting();
    const first = decide(paths, { x: 40, y: 20 }, { x: 45, y: 20 });
    expect(first.next).toMatchObject(NO_PATH);

    const second = decide(paths, { x: 40, y: 20 }, { x: 45, y: 21 }, first.next);

    expect(calls.searches).toBe(2);
    expect(second.commands).toEqual([{ type: 'move', actorId: 'bot', direction: { x: 5, y: 1 } }]);
  });

  it('searches again when the cached waypoint is no longer on the way (the bot was shoved past it)', () => {
    const { calls, paths } = counting();
    const first = decide(paths, { x: 40, y: 20 }, { x: 80, y: 20 });
    decide(paths, { x: 78, y: 22 }, { x: 80, y: 20 }, first.next);
    expect(calls.searches).toBe(2);
  });

  it('searches again when the straight line to the destination has opened', () => {
    const { calls, paths } = counting();
    const first = decide(paths, { x: 40, y: 20 }, { x: 80, y: 20 });
    const opened: PathQuery = { ...paths, isLineClear: () => true };
    decide(opened, { x: 42, y: 21 }, { x: 80, y: 20 }, first.next);
    expect(calls.searches).toBe(2);
  });

  it('forgets the path on arrival', () => {
    const { paths } = counting();
    const first = decide(paths, { x: 40, y: 20 }, { x: 80, y: 20 });
    const there = decide(paths, { x: 80, y: 21 }, { x: 80, y: 20 }, first.next);
    expect(there.next).toMatchObject(NO_PATH);
  });
});
