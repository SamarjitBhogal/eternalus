import { describe, expect, it } from 'vitest';
import { BotNavigator } from './BotNavigator';
import type { BotPoint, WaypointSource } from './BotNavigator.types';

const OWN = { x: 0, y: 0, radius: 1 };
const FAR_ENEMY = { x: 100, y: 0 };

/** A path source that always answers `to` (or no way when `to` is null). */
const pathTo = (to: BotPoint | null): WaypointSource => ({
  waypoint: (_start, _goal, out) => {
    if (to === null) {
      return false;
    }
    out.x = to.x;
    out.y = to.y;
    return true;
  },
});

describe('BotNavigator', () => {
  it('walks toward the waypoint, not toward the enemy, as a unit vector', () => {
    const intent = new BotNavigator(pathTo({ x: 0, y: 30 })).step(OWN, FAR_ENEMY);

    expect(intent.move).toEqual({ x: 0, y: 1 });
    expect(intent.aim).toEqual(FAR_ENEMY);
    expect(intent.isAttacking).toBe(false);
  });

  it('normalises a diagonal step', () => {
    const { move } = new BotNavigator(pathTo({ x: 3, y: 4 })).step(OWN, FAR_ENEMY);

    expect(move).toEqual({ x: 0.6, y: 0.8 });
  });

  it('stands still when there is no way or the waypoint is its own spot', () => {
    expect(new BotNavigator(pathTo(null)).step(OWN, FAR_ENEMY).move).toEqual({ x: 0, y: 0 });
    expect(new BotNavigator(pathTo({ x: 0, y: 0 })).step(OWN, FAR_ENEMY).move).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('stops and holds the attack once the enemy is in reach', () => {
    const intent = new BotNavigator(pathTo({ x: 50, y: 0 })).step(OWN, { x: 2, y: 0 });

    expect(intent).toEqual({
      move: { x: 0, y: 0 },
      aim: { x: 2, y: 0 },
      triggered: [],
      isAttacking: true,
    });
  });
});
