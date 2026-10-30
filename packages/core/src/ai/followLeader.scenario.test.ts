// PROTOTYPE(PROTO-01) TEMPORARY: tests demo code; delete with `FollowLeaderController.ts`.
import { describe, expect, it } from 'vitest';

import type { Command } from '../commands/Command.types';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { FOLLOW_LEADER_PROFILE } from '../content/ai/followLeaderProfile';
import { NullLogger } from '../diagnostics/NullLogger';
import { Simulation } from '../Simulation';
import type { Vec2 } from '../utils/geometry.types';

const ESCORT = 4;

/** A Warrior and four light minions on its team; the Warrior walks east for `walkTicks`. */
const run = (walkTicks: number, restTicks: number) => {
  const sim = new Simulation({
    // No countdown: the countdown holds all movement (match/phases/CountdownPhase.test.ts).
    config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
    seed: 7,
    logger: new NullLogger(),
  });
  const spawn = (kind: string, definitionId: string, at: Vec2): Command => ({
    type: 'dev-spawn',
    kind,
    definitionId,
    team: 'light',
    at,
    count: 1,
  });
  sim.enqueueCommand(spawn('warrior', 'warrior', { x: 50, y: 50 }));
  for (let index = 0; index < ESCORT; index += 1) {
    sim.enqueueCommand(spawn('light-mob', 'light-minion', { x: 48 + index, y: 48 }));
  }
  sim.step();
  const legendId = sim.snapshot().entities.find((entity) => entity.family === 'legend')?.id ?? '';
  sim.enqueueCommand({ type: 'move', actorId: legendId, direction: { x: 1, y: 0 } });
  for (let tick = 0; tick < walkTicks; tick += 1) {
    sim.step();
  }
  sim.enqueueCommand({ type: 'stop', actorId: legendId });
  for (let tick = 0; tick < restTicks; tick += 1) {
    sim.step();
  }
  const positions = sim.snapshot().entities.map((entity) => ({
    family: entity.family,
    x: entity.transform?.x ?? NaN,
    y: entity.transform?.y ?? NaN,
  }));
  return { sim, positions };
};

describe('follow-leader prototype (scenario)', () => {
  it('minions follow their Legend across the map and settle around it', () => {
    const { positions } = run(150, 120);
    const legend = positions.find((entity) => entity.family === 'legend');
    const minions = positions.filter((entity) => entity.family === 'mob');

    expect(legend?.x).toBeGreaterThan(70);
    expect(minions).toHaveLength(ESCORT);
    for (const minion of minions) {
      const distance = Math.hypot(minion.x - (legend?.x ?? 0), minion.y - (legend?.y ?? 0));
      expect(distance).toBeLessThan(FOLLOW_LEADER_PROFILE.followDistance + 2);
    }
  });

  it('is deterministic: the same run gives the same hash', () => {
    expect(run(60, 30).sim.hash()).toBe(run(60, 30).sim.hash());
  });
});
