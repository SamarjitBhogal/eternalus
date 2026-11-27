import { describe, expect, it } from 'vitest';

import { BossMoveCast } from '../../components/BossMoveCast';
import { Health } from '../../components/Health';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadBossTelegraphTicks } from '../../content/ai/bosses/bossProfiles';
import { GREATER_BOSS_PROFILE } from '../../content/ai/bosses/greaterBoss';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
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
  const handle = (actorId: string, moveId: string) =>
    handler.handle({ type: 'boss-move', actorId, moveId }, { state, factory });
  return { boss, guard, handle, telegraphs };
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

  it('rejects a dead boss', () => {
    const { boss, handle } = setUp();
    boss.getComponent(Health).applyDamage(10_000_000);

    expect(handle(boss.id, SLAM.id)).toBe('unknown-entity');
  });
});
