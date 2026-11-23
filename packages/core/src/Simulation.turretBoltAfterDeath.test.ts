import { describe, expect, it } from 'vitest';
import { Health } from './components/Health';
import { ProjectilePayload } from './components/ProjectilePayload';
import { loadTurrets } from './content/structures/loadTurrets';
import { RELEASE_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import type { GameEventMap } from './state/GameEvents.types';
import {
  config,
  TURRET_FEATURES,
  setUp,
  outside,
  COUNTDOWN,
  spawnDark,
} from './__fixtures__/turretMatch';

/** A light turret whose line out, turned 60 degrees, is open for its whole range. */
const FIRING_TURRET = TURRET_FEATURES.find(({ id }) => id === 'light-turret-2');
const HEAVY_BOLT = loadTurrets(config.tickRate).ammo.get('bolt-heavy');

describe('Simulation wall turrets: a bolt whose turret is destroyed in flight (S4)', () => {
  it('still concusses its target with a heavy bolt that lands after its turret is destroyed and removed', () => {
    // The lethal hit below skips the damage pipeline, which the test invariants refuse.
    const match = setUp({ debug: RELEASE_DEBUG_CONFIG });
    const { state, run, turretOf } = match;
    const feature = FIRING_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light-turret-2.');
    const turretId = turretOf(feature)?.id ?? '';
    const sentinelId = spawnDark(match, 'sentinel', 'sentinel', outside(feature, 4));
    let boltId = '';
    state.events.on('entity-spawned', ({ entityId, kind }) => {
      const isTurretBolt =
        kind === 'projectile' &&
        state.entities.get(entityId)?.findComponent(ProjectilePayload)?.ownerId === turretId;
      if (boltId !== '' || !isTurretBolt) return;
      boltId = entityId;
      // Destroyed in the tick it fires: removed at the end of this tick, before the bolt moves.
      state.entities.get(turretId)?.getComponent(Health).applyDamage(1e6);
    });
    const hits: number[] = [];
    state.events.on('damage-applied', ({ targetId, amount, absorbed, source }) => {
      if (targetId === sentinelId && source.attackerId === turretId) hits.push(amount + absorbed);
    });
    const statuses: GameEventMap['status-applied'][] = [];
    state.events.on('status-applied', (applied) => statuses.push(applied));

    for (let tick = 0; tick < COUNTDOWN + 30 && boltId === ''; tick += 1) run(1);

    expect(boltId).not.toBe('');
    expect(state.entities.has(turretId)).toBe(false);
    expect(state.entities.has(boltId)).toBe(true);
    expect(hits).toEqual([]);

    run(30);

    expect(hits).toEqual([HEAVY_BOLT.attack.damage]);
    expect(statuses.filter(({ entityId }) => entityId === sentinelId)).toEqual([
      { entityId: sentinelId, statusId: 'concussion', sourceId: turretId },
    ]);
  });
});
