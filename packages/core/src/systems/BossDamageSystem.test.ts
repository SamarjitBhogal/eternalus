import { describe, expect, it } from 'vitest';

import { BossPhase } from '../components/BossPhase';
import { Health } from '../components/Health';
import { ThreatLedger } from '../components/ThreatLedger';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { BOSS_PROFILES } from '../content/ai/bosses/bossProfiles';
import { GREATER_BOSS_PROFILE } from '../content/ai/bosses/greaterBoss';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import { TickRate } from '../utils/TickRate';
import { BossDamageSystem } from './BossDamageSystem';

const CONFIG = createDefaultGameConfig();
const THREAT_TICKS = new TickRate(CONFIG.tickRate).toTicks(
  GREATER_BOSS_PROFILE.brain.threatSeconds,
);
const SHARE = GREATER_BOSS_PROFILE.hurtPhase.healthShare;
const logger = new NullLogger();

/** The Greater Boss (entity-1), a tower guard (entity-2) and two Warriors (entity-3, entity-4). */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const system = new BossDamageSystem(state, BOSS_PROFILES);
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
  const [a, b] = [0, 1].map((at) =>
    factory.create('warrior', 'warrior', { team: 'light', position: { x: at, y: 3 } }),
  );
  if (a === undefined || b === undefined) throw new Error('no warriors');
  for (const entity of [boss, guard, a, b]) state.entities.add(entity);
  const changes: unknown[] = [];
  state.events.on('boss-phase-changed', (payload) => changes.push(payload));
  /** `attackerId` deals `share` of the target's max health, as `DamagePipeline` reports it. */
  const hit = (targetId: string, attackerId: string | null, share: number): void => {
    const health = state.entities.get(targetId)?.getComponent(Health);
    if (health === undefined) throw new Error(`no ${targetId}`);
    const amount = health.max * share;
    health.applyDamage(amount);
    state.events.emit('damage-applied', {
      targetId,
      amount,
      absorbed: 0,
      source: { attackerId, kind: 'weapon', definitionId: 'test' },
    });
  };
  const tick = (): void => {
    system.update({ state, logger });
    state.advanceTick();
  };
  return { state, boss, guard, a: a.id, b: b.id, hit, tick, changes };
};

describe('BossDamageSystem', () => {
  it("records each attacker's damage to a boss, and nobody's damage to a unit that is not one", () => {
    const { state, boss, guard, a, b, hit } = setUp();
    const max = boss.getComponent(Health).max;
    hit(boss.id, a, 0.01);
    hit(boss.id, b, 0.02);
    hit(boss.id, a, 0.01);
    hit(boss.id, null, 0.05);
    hit(guard.id, a, 0.1);

    expect(state.entities.recentDamageTo(boss.id, 0)).toEqual([
      { attackerId: a, amount: max * 0.02 },
      { attackerId: b, amount: max * 0.02 },
    ]);
    expect(guard.hasComponent(ThreatLedger)).toBe(false);
  });

  it('forgets a hit once it is older than the threat window', () => {
    const { state, boss, a, b, hit, tick } = setUp();
    const max = boss.getComponent(Health).max;
    hit(boss.id, a, 0.01);
    for (let at = 0; at <= THREAT_TICKS; at += 1) tick();
    hit(boss.id, b, 0.01);

    expect(state.entities.recentDamageTo(boss.id, 0)).toEqual([
      { attackerId: b, amount: max * 0.01 },
    ]);
  });

  it('turns the boss hurt once, on the first tick below its share, and announces it', () => {
    const { state, boss, a, hit, tick, changes } = setUp();
    hit(boss.id, a, 1 - SHARE - 0.01);
    tick();
    expect(state.entities.bossPhaseOf(boss.id)).toBe('healthy');

    hit(boss.id, a, 0.02);
    const changeTick = state.tick;
    tick();
    hit(boss.id, a, 0.02);
    tick();

    const phase = boss.getComponent(BossPhase);
    expect([phase.phase, phase.changedTick]).toEqual(['hurt', changeTick]);
    expect(changes).toEqual([{ bossId: boss.id, from: 'healthy', to: 'hurt' }]);
  });

  it('turns the boss hurt on damage with no attacker too, which the ledger leaves out', () => {
    const { state, boss, hit, tick, changes } = setUp();
    hit(boss.id, null, 1 - SHARE + 0.01);
    tick();

    expect(state.entities.bossPhaseOf(boss.id)).toBe('hurt');
    expect(state.entities.recentDamageTo(boss.id, 0)).toEqual([]);
    expect(changes).toEqual([{ bossId: boss.id, from: 'healthy', to: 'hurt' }]);
  });

  it('leaves a boss set back to healthy alone until its next hit, and a dead boss alone', () => {
    const { state, boss, a, hit, tick, changes } = setUp();
    hit(boss.id, a, 1 - SHARE + 0.01);
    tick();
    state.entities.setBossPhase(boss.id, 'healthy', state.tick);
    tick();
    tick();
    expect(state.entities.bossPhaseOf(boss.id)).toBe('healthy');

    hit(boss.id, a, 0.01);
    tick();
    expect(state.entities.bossPhaseOf(boss.id)).toBe('hurt');

    const dead = setUp();
    dead.hit(dead.boss.id, dead.a, 1);
    dead.tick();
    expect(dead.state.entities.bossPhaseOf(dead.boss.id)).toBe('healthy');
    expect(dead.changes).toEqual([]);
    expect(changes).toHaveLength(2);
  });

  it('puts the ledger and the phase in the state hash', () => {
    const hashOf = (attacker: 'a' | 'b', phase: 'hurt' | 'healthy'): number => {
      const match = setUp();
      match.hit(match.boss.id, match[attacker], 1 - SHARE + 0.01);
      match.tick();
      match.state.entities.setBossPhase(match.boss.id, phase, match.state.tick - 1);
      return new StateHasher().hash(match.state);
    };

    expect(hashOf('a', 'hurt')).toBe(hashOf('a', 'hurt'));
    expect(hashOf('b', 'hurt')).not.toBe(hashOf('a', 'hurt'));
    expect(hashOf('a', 'healthy')).not.toBe(hashOf('a', 'hurt'));
  });
});
