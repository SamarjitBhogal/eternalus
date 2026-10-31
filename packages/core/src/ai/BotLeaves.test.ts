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
};

/** A pathfinder stub that never finds a way. */
const NO_WAY: PathQuery = { waypoint: () => false };

/** A turn for a bot at `position` on the blocked-lane map, with or without pathfinding. */
const turnAt = (
  position: { x: number; y: number },
  withPaths: boolean,
  paths: PathQuery = STUB_PATHS,
): BotTurn => {
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(BLOCKED_LANE_MAP), {
    paths: withPaths ? paths : null,
  });
  const memory = { lane: 'lane-0', isRetreating: false, targetId: null, nextCastTick: 0 };
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
