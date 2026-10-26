import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { AStarPathfinder } from '../map/AStarPathfinder';
import { WorldMap } from '../map/WorldMap';
import { GameState } from '../state/GameState';
import { SeededRandom } from '../utils/SeededRandom';
import type { BotTurn } from './BotLegendController.types';
import { BotLeaves } from './BotLeaves';
import { Perception } from './perception/Perception';

const leaves = new BotLeaves({
  difficulties: { normal: NORMAL_BOT },
  retreatTo: RETREAT_STRUCTURES,
});

/** A turn for a bot at `position` on the blocked-lane map (rift at x 50..70, y 10..30). */
const turnAt = (position: { x: number; y: number }, withPaths: boolean): BotTurn => {
  const grid = WorldMap.fromDefinition(BLOCKED_LANE_MAP, 2, () => false);
  const state = new GameState(
    createDefaultGameConfig(),
    1,
    BLOCKED_LANE_MAP,
    null,
    withPaths ? new AStarPathfinder(grid, 10_000) : null,
  );
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
  it('heads for a waypoint around the rift when the straight line crosses it', () => {
    const turn = turnAt({ x: 40, y: 20 }, true);

    leaves.moveTo(turn, { x: 80, y: 20 });

    const [move] = turn.commands;
    expect(move?.type === 'move' && move.direction.y !== 0).toBe(true);
  });

  it('walks straight when the line is clear, or when the match has no pathfinding', () => {
    const clear = turnAt({ x: 40, y: 20 }, true);
    leaves.moveTo(clear, { x: 45, y: 20 });
    const blind = turnAt({ x: 40, y: 20 }, false);
    leaves.moveTo(blind, { x: 80, y: 20 });

    expect(clear.commands).toEqual([{ type: 'move', actorId: 'bot', direction: { x: 5, y: 0 } }]);
    expect(blind.commands).toEqual([{ type: 'move', actorId: 'bot', direction: { x: 40, y: 0 } }]);
  });
});
