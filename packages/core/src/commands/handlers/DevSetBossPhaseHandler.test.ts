import { describe, expect, it } from 'vitest';

import { BossPhase } from '../../components/BossPhase';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import { DevSetBossPhaseHandler } from './DevSetBossPhaseHandler';

const CONFIG = createDefaultGameConfig();

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
  const changes: unknown[] = [];
  state.events.on('boss-phase-changed', (payload) => changes.push(payload));
  const handler = new DevSetBossPhaseHandler();
  const handle = (entityId: string, phase: 'healthy' | 'hurt') =>
    handler.handle({ type: 'dev-set-boss-phase', entityId, phase }, { state, factory });
  return { state, boss, guard, handle, changes };
};

describe('DevSetBossPhaseHandler', () => {
  it('puts the boss in the phase on this tick and announces the change', () => {
    const { state, boss, handle, changes } = setUp();

    expect(state.entities.bossPhaseOf(boss.id)).toBe('healthy');
    expect(handle(boss.id, 'hurt')).toBeNull();
    expect(boss.getComponent(BossPhase).phase).toBe('hurt');
    expect(boss.getComponent(BossPhase).changedTick).toBe(5);
    expect(state.entities.bossPhaseOf(boss.id)).toBe('hurt');
    expect(changes).toEqual([{ bossId: boss.id, from: 'healthy', to: 'hurt' }]);
  });

  it('changes nothing, and announces nothing, for the phase the boss is already in', () => {
    const { boss, handle, changes } = setUp();

    expect(handle(boss.id, 'healthy')).toBeNull();
    expect(boss.findComponent(BossPhase)).toBeUndefined();
    expect(changes).toEqual([]);
  });

  it.each([
    ['an unknown entity', 'entity-404', 'unknown-entity'],
    ['a unit on another controller (not a boss)', 'entity-2', 'invalid-target'],
  ])('rejects %s', (_, entityId, reason) => {
    const { handle, changes } = setUp();

    expect(handle(entityId, 'hurt')).toBe(reason);
    expect(changes).toEqual([]);
  });
});
