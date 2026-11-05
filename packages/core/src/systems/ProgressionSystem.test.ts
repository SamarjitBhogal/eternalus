import { describe, expect, it } from 'vitest';

import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { WARRIOR } from '../content/legends/warrior';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import type { GameEventType } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { Team } from '../teams/teams.types';
import { ProgressionSystem } from './ProgressionSystem';
import { loadWeapons } from '../content/weapons/loadWeapons';

const CONFIG = createDefaultGameConfig();
const UNITS = loadDefaultContent(CONFIG.tickRate);
/** A short stand-in for the shipped curve, so these tests do not move with its tuning. */
const CURVES = new ContentCatalogue<LevelCurveDefinition>([
  { id: 'legend', cap: 4, xpToNext: [100, 150, 200] },
]);
const XP_SOURCES = { legendKill: { base: 150, perVictimLevel: 25 } };

const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    UNITS,
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const system = new ProgressionSystem(state, {
    units: UNITS,
    curves: CURVES,
    xpSources: XP_SOURCES,
  });
  const kill = (killer: Entity | null, victim: Entity) => {
    state.events.emit('entity-died', {
      entityId: victim.id,
      killer: {
        attackerId: killer?.id ?? null,
        kind: killer === null ? 'environment' : 'weapon',
        definitionId: killer?.definitionId ?? 'lava',
      },
    });
  };
  const run = () => {
    system.update({ state, logger: new NullLogger() });
  };
  const payloads = (type: GameEventType) =>
    state.events
      .recentEvents()
      .filter((event) => event.type === type)
      .map((event) => event.payload);
  return { state, spawn, kill, run, payloads };
};

describe('ProgressionSystem', () => {
  it("gives the killer the mob's own xpValue in its pass, announcing the award", () => {
    const { spawn, kill, run, payloads } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');
    const minion = spawn('light-mob', 'light-minion', 'dark');

    kill(warrior, minion);
    expect(warrior.getComponent(Progression).xp).toBe(0);
    run();

    expect(warrior.getComponent(Progression).xp).toBe(20);
    expect(payloads('xp-gained')).toEqual([
      { entityId: warrior.id, amount: 20, victimId: minion.id, victimTeam: 'dark' },
    ]);
  });

  it('pays nothing for the training dummy (O8)', () => {
    const { spawn, kill, run, payloads } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');

    kill(warrior, spawn('light-mob', 'training-dummy', 'dark'));
    run();

    expect(warrior.getComponent(Progression).xp).toBe(0);
    expect(payloads('xp-gained')).toEqual([]);
  });

  it('prices a Legend kill by the victim level; the level-up raises the caps and heals by the raise (O3)', () => {
    const { spawn, kill, run, payloads } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');
    const health = warrior.getComponent(Health);
    const aether = warrior.getComponent(Aether);
    health.applyDamage(50);
    aether.spend(30);
    const [maxHealth, currentHealth, maxAether, currentAether] = [
      health.max,
      health.current,
      aether.max,
      aether.current,
    ];

    kill(warrior, spawn('magus', 'magus', 'dark'));
    run();

    // 150 + 25 × 1 = 175 XP ≥ 100: level 2.
    expect(warrior.getComponent(Progression)).toMatchObject({ xp: 175, level: 2 });
    const raise = WARRIOR.baseHealth * WARRIOR.levelScaling.healthPerLevel;
    expect(health.max).toBeCloseTo(maxHealth + raise);
    expect(health.current).toBeCloseTo(currentHealth + raise);
    expect(aether.max).toBe(maxAether + WARRIOR.levelScaling.aetherPerLevel);
    expect(aether.current).toBe(currentAether + WARRIOR.levelScaling.aetherPerLevel);
    expect(payloads('level-up')).toEqual([{ entityId: warrior.id, level: 2 }]);
  });

  it('announces every level of a multi-level gain, in order', () => {
    const { spawn, kill, run, payloads } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');

    for (const enemy of [1, 2, 3].map(() => spawn('magus', 'magus', 'dark'))) {
      kill(warrior, enemy);
    }
    run();

    // 3 × 175 = 525 XP: levels 2, 3 (250) and 4 (450).
    expect(payloads('level-up').map((payload) => (payload as { level: number }).level)).toEqual([
      2, 3, 4,
    ]);
  });

  it('ignores kills with no attacker and attackers that do not level', () => {
    const { spawn, kill, run, payloads } = setUp();
    const minion = spawn('light-mob', 'light-minion', 'light');
    const warrior = spawn('warrior', 'warrior', 'dark');

    kill(minion, warrior);
    kill(null, minion);
    run();

    expect(warrior.getComponent(Progression).xp).toBe(0);
    expect(payloads('xp-gained')).toEqual([]);
    expect(payloads('level-up')).toEqual([]);
  });

  it('pays nothing for a self-kill or an ally kill (O5), but pays for a neutral mob', () => {
    const { spawn, kill, run } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');

    kill(warrior, warrior);
    kill(warrior, spawn('magus', 'magus', 'light'));
    run();
    expect(warrior.getComponent(Progression).xp).toBe(0);

    kill(warrior, spawn('light-mob', 'light-minion', 'neutral'));
    run();
    expect(warrior.getComponent(Progression).xp).toBe(20);
  });

  it('a dead killer still earns XP and levels, raising its caps without healing or refilling (O4)', () => {
    const { spawn, kill, run } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');
    const health = warrior.getComponent(Health);
    const aether = warrior.getComponent(Aether);
    health.applyDamage(1_000_000);
    aether.spend(aether.current);
    const [maxHealth, maxAether] = [health.max, aether.max];

    kill(warrior, spawn('magus', 'magus', 'dark'));
    run();

    expect(warrior.getComponent(Progression).level).toBe(2);
    expect(health.max).toBeGreaterThan(maxHealth);
    expect(health.isDead).toBe(true);
    expect(aether.max).toBeGreaterThan(maxAether);
    expect(aether.current).toBe(0);
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
});
