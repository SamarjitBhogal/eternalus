import { describe, expect, it } from 'vitest';

import { Movement } from '../components/Movement';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { GameState } from '../state/GameState';
import { SeededRandom } from '../utils/SeededRandom';
import type { BotMemory, BotTurn } from './BotLegendController.types';
import { BotMovement } from './BotMovement';
import { Perception } from './perception/Perception';

const CONFIG = createDefaultGameConfig();
const SENTINEL = loadDefaultContent(CONFIG.tickRate).get('sentinel').movementProfile;
const TARGET = { x: 30, y: 0 };

/**
 * A bot Sentinel at top speed heads east for `TARGET`, 30 m ahead. Each tick the bot decides
 * (`moveTo`), its `move` steers the Sentinel, and the Sentinel advances (no walls on the way).
 * Returns where it stood and how fast it went after each tick.
 */
const runToTarget = (ticks: number) => {
  const movement = new Movement(SENTINEL);
  movement.steer({ x: 1, y: 0 });
  while (movement.speed < SENTINEL.maxSpeed) {
    movement.advance();
  }
  const state = new GameState(CONFIG, 1);
  const perception = new Perception(state);
  const rng = new SeededRandom(1);
  const bot = new BotMovement();
  let memory: BotMemory = {
    lane: 'lane-0',
    isRetreating: false,
    targetId: null,
    nextCastTick: 0,
    isHalted: false,
  };
  const position = { x: 0, y: 0 };
  const trace: { x: number; vx: number; speed: number }[] = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    const turn: BotTurn = {
      state,
      id: 'bot',
      team: 'light',
      position: { ...position },
      difficulty: NORMAL_BOT,
      perception,
      rng,
      memory,
      next: memory,
      commands: [],
      enemy: null,
      objective: null,
      destination: null,
    };
    bot.moveTo(turn, TARGET);
    for (const command of turn.commands) {
      if (command.type === 'move') movement.steer(command.direction);
    }
    memory = turn.next;
    movement.advance();
    position.x += movement.velocity.x;
    position.y += movement.velocity.y;
    trace.push({ x: position.x, vx: movement.velocity.x, speed: movement.speed });
  }
  return trace;
};

describe('BotMovement with a momentum unit (the Sentinel, DEC-307)', () => {
  it('halts a bot Sentinel at top speed near its target within 6 s, and it stays there', () => {
    const trace = runToTarget(10 * CONFIG.tickRate);
    const settled = trace.slice(6 * CONFIG.tickRate);

    expect(settled.every(({ speed }) => speed === 0)).toBe(true);
    for (const { x } of settled) {
      expect(Math.abs(x - TARGET.x)).toBeLessThanOrEqual(NORMAL_BOT.arrivalDistance);
    }
  });

  it('slides past the target by less than its braking distance and turns back at most once', () => {
    const trace = runToTarget(10 * CONFIG.tickRate);
    const momentum = SENTINEL.momentum;
    if (momentum === undefined) throw new Error('The shipped Sentinel has momentum.');
    // v² / (2 · grip): the slide from top speed once the bot halts (per-tick units cancel to metres).
    const brakingDistance = SENTINEL.maxSpeed ** 2 / (2 * momentum.grip);
    const furthest = Math.max(...trace.map(({ x }) => x));
    const directions = trace.filter(({ vx }) => vx !== 0).map(({ vx }) => Math.sign(vx));
    const turns = directions.filter((sign, i) => i > 0 && sign !== directions[i - 1]).length;

    expect(furthest - TARGET.x).toBeLessThan(brakingDistance);
    expect(turns).toBeLessThanOrEqual(1);
  });
});
