import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { AStarPathfinder } from '../map/AStarPathfinder';
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
  const memory = {
    lane: 'lane-0',
    isRetreating: false,
    targetId: null,
    nextCastTick: 0,
    isHalted: false,
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

  it('halts at the near edge of blocked ground it is sent into, instead of turning back and forth at the cell A* snaps to (playtest 2026-11-04)', () => {
    // The rift block (x 50..70, y 10..30) stands in for a tower footprint; its middle for the
    // tower's centre, the point a retreating bot is sent to.
    const world = matchWorldOf(BLOCKED_LANE_MAP);
    const { pathMaxExpansions, pathSnapCells } = createDefaultGameConfig().map;
    const state = new GameState(createDefaultGameConfig(), 1, world, {
      paths: new AStarPathfinder(world.grid, {
        maxExpansions: pathMaxExpansions,
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

  it('forgets the remembered target when the pathfinder finds no way, since the stop cleared it', () => {
    const turn = { ...turnAt({ x: 40, y: 20 }, true, NO_WAY) };
    turn.next = { ...turn.next, targetId: 'enemy' };

    leaves.moveTo(turn, { x: 80, y: 20 });

    expect(turn.next.targetId).toBeNull();
    expect(turn.next.lane).toBe('lane-0');
  });
});
