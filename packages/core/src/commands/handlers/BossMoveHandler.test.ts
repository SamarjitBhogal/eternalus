import { describe, expect, it } from 'vitest';

import { BossMoveCast } from '../../components/BossMoveCast';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadBossTelegraphTicks } from '../../content/ai/bosses/bossProfiles';
import { GREATER_BOSS_PROFILE } from '../../content/ai/bosses/greaterBoss';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import { MovementSystem } from '../../systems/MovementSystem';
import { BossMoveHandler } from './BossMoveHandler';

const CONFIG = createDefaultGameConfig();
const [SLAM] = GREATER_BOSS_PROFILE.moves;
const TELEGRAPH_TICKS = Math.round(SLAM.telegraphSeconds * CONFIG.tickRate);

/** The Greater Boss (entity-1) and a tower guard on `GuardController` (entity-2), on tick 5. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const boss = factory.create('heavy-mob', 'greater-boss', {
    position: { x: 0, y: 0 },
    team: 'neutral',
  });
  const guard = factory.create('light-mob', 'light-guard', {
    position: { x: 3, y: 0 },
    team: 'light',
  });
  state.entities.add(boss);
  state.entities.add(guard);
  for (let tick = 0; tick < 5; tick += 1) state.advanceTick();
  const telegraphs: unknown[] = [];
  state.events.on('boss-telegraph', (payload) => telegraphs.push(payload));
  const handler = new BossMoveHandler(loadBossTelegraphTicks(CONFIG.tickRate));
  const handle = (actorId: string, moveId: string, targetId?: string) =>
    handler.handle(
      { type: 'boss-move', actorId, moveId, ...(targetId === undefined ? {} : { targetId }) },
      { state, factory },
    );
  return { state, boss, guard, handle, telegraphs };
};

describe('BossMoveHandler', () => {
  it('records the move to land its content telegraph from now, and announces it', () => {
    const { boss, handle, telegraphs } = setUp();

    expect(handle(boss.id, SLAM.id)).toBeNull();
    expect(boss.getComponent(BossMoveCast).fields).toEqual([SLAM.id, 5 + TELEGRAPH_TICKS]);
    expect(telegraphs).toEqual([{ bossId: boss.id, move: SLAM.id }]);
  });

  it.each([
    ['an unknown actor', 'entity-404', SLAM.id, 'unknown-entity'],
    ['a move its profile does not list', 'entity-1', 'boss-hug', 'unknown-definition'],
    [
      'a boss move from a unit on another controller (not a boss)',
      'entity-2',
      SLAM.id,
      'unknown-definition',
    ],
  ])('rejects %s, starting and announcing nothing', (_, actorId, moveId, reason) => {
    const { boss, guard, handle, telegraphs } = setUp();

    expect([boss.id, guard.id]).toEqual(['entity-1', 'entity-2']);
    expect(handle(actorId, moveId)).toBe(reason);
    expect([boss, guard].map((entity) => entity.hasComponent(BossMoveCast))).toEqual([
      false,
      false,
    ]);
    expect(telegraphs).toEqual([]);
  });

  it('turns the boss to face its target first, and keeps its facing without one', () => {
    const { boss, guard, handle } = setUp();
    guard.getComponent(Transform).moveTo({ x: 0, y: 3 });
    const facing = () => ({ ...boss.getComponent(Transform).facing });
    const before = facing();

    expect(handle(boss.id, SLAM.id)).toBeNull();
    expect(facing()).toEqual(before);
    expect(handle(boss.id, SLAM.id, guard.id)).toBeNull();
    expect(facing().x).toBeCloseTo(0, 9);
    expect(facing().y).toBeCloseTo(1, 9);
  });

  it('stops a walking boss at once, so the next movement tick keeps it facing its target', () => {
    const { state, boss, guard, handle } = setUp();
    guard.getComponent(Transform).moveTo({ x: 0, y: 3 });
    const movement = boss.getComponent(Movement);
    const walk = new MovementSystem();
    movement.steer({ x: 1, y: 0 });
    walk.update({ state, logger: new MemoryLogger() });
    expect(movement.speed).toBeGreaterThan(0);

    expect(handle(boss.id, SLAM.id, guard.id)).toBeNull();
    walk.update({ state, logger: new MemoryLogger() });
    const { facing, position } = boss.getComponent(Transform);
    const toGuard = Math.hypot(position.x, 3 - position.y);

    expect([movement.speed, movement.heading.x, movement.heading.y]).toEqual([0, 0, 0]);
    expect(position.x).toBeGreaterThan(0);
    expect(facing.x).toBeCloseTo(-position.x / toGuard, 9);
    expect(facing.y).toBeCloseTo((3 - position.y) / toGuard, 9);
  });

  it('rejects a dead boss', () => {
    const { boss, handle } = setUp();
    boss.getComponent(Health).applyDamage(10_000_000);

    expect(handle(boss.id, SLAM.id)).toBe('unknown-entity');
  });
});
