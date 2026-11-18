import { describe, expect, it } from 'vitest';

import { Capturable } from '../components/Capturable';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { CAPTURE_POINT } from '../content/zones/capturePoint';
import { ZONE_LOCKING_MOBS } from '../content/zones/zoneLocks';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { CapturePoint } from '../entities/zones/CapturePoint';
import { GameState } from '../state/GameState';
import { CaptureSystem } from './CaptureSystem';

const TICK_RATE = 30;
const CENTER = { x: 800, y: 450 };
const AREA = [
  [
    { x: CENTER.x - 35, y: CENTER.y - 35 },
    { x: CENTER.x + 35, y: CENTER.y - 35 },
    { x: CENTER.x + 35, y: CENTER.y + 35 },
    { x: CENTER.x - 35, y: CENTER.y + 35 },
  ],
];

/** A capture point with a guard post per `mobIds` entry, each filled by a living guard. */
const setUp = (...mobIds: string[]) => {
  const config = createDefaultGameConfig();
  const state = new GameState(config, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(TICK_RATE),
    undefined,
    loadWeapons(TICK_RATE),
  );
  const point = new CapturePoint('zone-1', CAPTURE_POINT.id);
  point.spawn({ definition: CAPTURE_POINT, position: CENTER, team: 'neutral', area: AREA });
  state.entities.add(point);
  const guards = mobIds.map((mobId, index) => {
    const guard = factory.create('heavy-mob', mobId, { position: CENTER, team: 'neutral' });
    state.entities.add(guard);
    state.guards.add({
      id: `post-${String(index)}`,
      homeId: point.id,
      team: 'neutral',
      mobId,
      row: index,
      indexInRow: 0,
      postX: CENTER.x,
      postY: CENTER.y,
      homeX: CENTER.x,
      homeY: CENTER.y,
      homeRadius: 0,
      leashRadius: 35,
      leashTolerance: 5,
      respawnTicks: 0,
    });
    state.guards.fill(index, guard.id);
    return guard;
  });
  const legend = factory.create('warrior', 'warrior', { position: CENTER, team: 'light' });
  state.entities.add(legend);
  const system = new CaptureSystem(config.match.capturePoints, TICK_RATE, ZONE_LOCKING_MOBS);
  const run = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      system.update({ state, logger: new NullLogger() });
    }
  };
  const kill = (guard: Entity) => {
    const health = guard.getComponent(Health);
    health.applyDamage(health.max);
  };
  return { state, zone: point.getComponent(Capturable), guards, run, kill };
};

/** Ticks a lone Legend needs to capture a neutral zone at the default rules, with margin. */
const CAPTURE_TICKS = 60 * TICK_RATE;

describe('CaptureSystem zone lock (reference 04, 07 §7)', () => {
  it('cannot be captured while its capture point boss lives, and still publishes presence', () => {
    const { zone, guards, run } = setUp('capture-point-boss');

    run(CAPTURE_TICKS);

    expect(zone.lockedBy).toBe(guards[0]?.id);
    expect(zone.progress).toBe(0);
    expect(zone.owner).toBe('neutral');
    expect(zone.presence.light).toBeGreaterThan(0);
  });

  it('unlocks the tick the boss dies, and the Legend then captures it', () => {
    const { zone, guards, run, kill } = setUp('capture-point-boss');
    run(1);
    const [boss] = guards;
    if (boss === undefined) throw new Error('no boss');

    kill(boss);
    run(1);
    expect(zone.lockedBy).toBeNull();
    expect(zone.progress).toBeGreaterThan(0);
    run(CAPTURE_TICKS);

    expect(zone.owner).toBe('light');
  });

  it('is not locked by a support mob that is not a locking mob', () => {
    const { zone, run } = setUp('heavy-guard');

    run(CAPTURE_TICKS);

    expect(zone.lockedBy).toBeNull();
    expect(zone.owner).toBe('light');
  });
});
