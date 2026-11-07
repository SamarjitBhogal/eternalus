import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import type { PathQuery } from '../state/PathQuery.types';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { SeededRandom } from '../utils/SeededRandom';
import type { BotTurn } from './BotLegendController.types';
import { BotLeaves } from './BotLeaves';
import { NO_PATH } from './BotLeaves.constants';
import { Perception } from './perception/Perception';

const leaves = new BotLeaves({
  difficulties: { normal: NORMAL_BOT },
  retreatTo: RETREAT_STRUCTURES,
});

/** A pathfinder stub: past x 50 it leads via (60, 34), otherwise straight to the goal. */
const STUB_PATHS: PathQuery = {
  waypoint: (_start, goal, out) => {
    const isBlocked = goal.x > 50;
    out.x = isBlocked ? 60 : goal.x;
    out.y = isBlocked ? 34 : goal.y;
    return true;
  },
  isLineClear: () => true,
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

  it('forgets the remembered target when the pathfinder finds no way, since the stop cleared it', () => {
    const turn = { ...turnAt({ x: 40, y: 20 }, true, NO_WAY) };
    turn.next = { ...turn.next, targetId: 'enemy' };

    leaves.moveTo(turn, { x: 80, y: 20 });

    expect(turn.next.targetId).toBeNull();
    expect(turn.next.lane).toBe('lane-0');
  });
});

describe('BotLeaves.moveTo path cache (11 §6)', () => {
  /** A stub that counts searches; `isClear` decides the line check. */
  const counting = (isClear = true) => {
    const calls = { searches: 0 };
    const paths: PathQuery = {
      waypoint: (start, goal, out) => {
        calls.searches += 1;
        return STUB_PATHS.waypoint(start, goal, out);
      },
      isLineClear: () => isClear,
    };
    return { calls, paths };
  };

  /** Runs `moveTo` from `position` toward `destination`, carrying `memory` from a previous turn. */
  const decide = (
    paths: PathQuery,
    position: { x: number; y: number },
    destination: { x: number; y: number },
    memory?: BotTurn['memory'],
  ) => {
    const base = turnAt(position, true, paths);
    const turn = memory === undefined ? base : { ...base, memory, next: memory };
    leaves.moveTo(turn, destination);
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

    const second = decide(paths, { x: 42, y: 21 }, { x: 81, y: 20 }, first.next);

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
});
