import { describe, expect, it } from 'vitest';

import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { WARRIOR } from '../content/legends/warrior';
import { XP_SOURCES } from '../content/progression/xpSources';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { Team } from '../teams/teams.types';
import { ProgressionSystem } from './ProgressionSystem';

const CONFIG = createDefaultGameConfig();

const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const system = new ProgressionSystem(state);
  const kill = (killer: Entity, victim: Entity) => {
    state.events.emit('entity-died', {
      entityId: victim.id,
      killer: { attackerId: killer.id, kind: 'weapon', definitionId: killer.definitionId },
    });
  };
  const run = () => {
    system.update({ state, logger: new NullLogger() });
  };
  return { state, spawn, kill, run };
};

describe('ProgressionSystem', () => {
  it("gives the killer a mob's XP in its own pass", () => {
    const { spawn, kill, run } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');
    const dummy = spawn('light-mob', 'training-dummy', 'dark');

    kill(warrior, dummy);
    expect(warrior.getComponent(Progression).xp).toBe(0);
    run();

    expect(warrior.getComponent(Progression).xp).toBe(XP_SOURCES.mobKill['light-mob']);
  });

  it('prices a Legend kill by the victim level and levels the killer up', () => {
    const { state, spawn, kill, run } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');
    const enemy = spawn('magus', 'magus', 'dark');
    const health = warrior.getComponent(Health);
    const aether = warrior.getComponent(Aether);
    const [maxHealth, maxAether] = [health.max, aether.max];

    kill(warrior, enemy);
    run();

    // 150 + 25 × 1 = 175 XP ≥ 100: level 2.
    const progression = warrior.getComponent(Progression);
    expect(progression.xp).toBe(XP_SOURCES.legendKill.base + XP_SOURCES.legendKill.perVictimLevel);
    expect(progression.level).toBe(2);
    expect(health.max).toBeCloseTo(
      maxHealth + health.baseMax * WARRIOR.levelScaling.healthPerLevel,
    );
    expect(aether.max).toBe(maxAether + WARRIOR.levelScaling.aetherPerLevel);
    expect(
      state.events
        .recentEvents()
        .filter((event) => event.type === 'level-up')
        .map((e) => e.payload),
    ).toEqual([{ entityId: warrior.id, level: 2 }]);
  });

  it('announces every level of a multi-level gain, in order', () => {
    const { state, spawn, run } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');
    const enemies = [1, 2, 3].map(() => spawn('magus', 'magus', 'dark'));

    for (const enemy of enemies) {
      state.events.emit('entity-died', {
        entityId: enemy.id,
        killer: { attackerId: warrior.id, kind: 'weapon', definitionId: 'warrior' },
      });
    }
    run();

    // 3 × 175 = 525 XP: levels 2, 3 (250) and 4 (450).
    const levels = state.events
      .recentEvents()
      .filter((event) => event.type === 'level-up')
      .map((event) => (event.payload as { level: number }).level);
    expect(levels).toEqual([2, 3, 4]);
  });

  it('ignores kills with no attacker and attackers that do not level', () => {
    const { state, spawn, kill, run } = setUp();
    const dummy = spawn('light-mob', 'training-dummy', 'light');
    const warrior = spawn('warrior', 'warrior', 'dark');

    kill(dummy, warrior);
    state.events.emit('entity-died', {
      entityId: dummy.id,
      killer: { attackerId: null, kind: 'environment', definitionId: 'lava' },
    });

    expect(() => {
      run();
    }).not.toThrow();
    expect(dummy.findComponent(Progression)).toBeUndefined();
  });

  it('gives the same hash for the same kills (determinism)', () => {
    const hash = (): number => {
      const { state, spawn, kill, run } = setUp();
      kill(spawn('warrior', 'warrior', 'light'), spawn('magus', 'magus', 'dark'));
      run();
      return new StateHasher().hash(state);
    };

    expect(hash()).toBe(hash());
  });

  it('levels up a killer that died this tick without reviving it', () => {
    const { spawn, kill, run } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');
    const enemy = spawn('magus', 'magus', 'dark');
    warrior.getComponent(Health).applyDamage(1_000_000);

    kill(warrior, enemy);
    run();

    expect(warrior.getComponent(Progression).level).toBe(2);
    expect(warrior.getComponent(Health).isDead).toBe(true);
  });
});
