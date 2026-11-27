import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { KillCredit } from '../combat/KillCredit';
import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { TeamMembership } from '../components/TeamMembership';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { WARRIOR } from '../content/legends/warrior';
import { LIGHT_MINION } from '../content/mobs/lightMinion';
import { CATHEDRAL_GEM } from '../content/structures/cathedralGem';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import type { Legend } from '../entities/Legend';
import { EntityFactory } from '../entities/EntityFactory';
import type { GameEventType } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { Team } from '../teams/teams.types';
import { IdGenerator } from '../utils/IdGenerator';
import { ProgressionSystem } from './ProgressionSystem';
import { loadWeapons } from '../content/weapons/loadWeapons';

const CONFIG = createDefaultGameConfig();
const UNITS = loadDefaultContent(CONFIG.tickRate);
/** A short stand-in for the shipped curve, so these tests do not move with its tuning. */
const CURVES = new ContentCatalogue<LevelCurveDefinition>([
  { id: 'legend', cap: 4, xpToNext: [100, 150, 200] },
]);
const XP_SOURCES = {
  legendKill: { base: 150, perVictimLevel: 25 },
  structureDestroyed: 300,
  campCleared: { 'forest-camp-light': 50 },
  teamKills: { 'capture-point-boss': { xp: 500, maxLevels: 2 } },
  checkpointCleared: { xp: { 1: 60 }, shareRadius: 10, evenShare: 0.6 },
};

const setUp = (legendsStartAtMaxLevel = false) => {
  const state = new GameState(CONFIG, 1);
  const ids = new IdGenerator();
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    UNITS,
    ids,
    loadWeapons(CONFIG.tickRate),
  );
  const structures = new EntityFactory(createDefaultEntityRegistry(), STRUCTURE_DEFINITIONS, ids);
  const spawn = (kind: string, definitionId: string, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const system = new ProgressionSystem(state, {
    units: UNITS,
    curves: CURVES,
    xpSources: XP_SOURCES,
    ...(legendsStartAtMaxLevel ? { legendsStartAtMaxLevel } : {}),
  });
  const announceSpawn = (entity: Entity, team: Team) => {
    state.events.emit('entity-spawned', { entityId: entity.id, kind: entity.kind, team });
  };
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
  const destroyStructure = (team: Team, kind = 'spawner-tower') => {
    state.events.emit('structure-destroyed', { entityId: 'entity-gone', kind, team, lane: null });
  };
  const clearCamp = (killer: Entity | null) => {
    const camp = structures.create('camp', 'forest-camp-light', {
      position: { x: 0, y: 0 },
      team: 'neutral',
    });
    state.entities.add(camp);
    state.events.emit('camp-cleared', {
      entityId: camp.id,
      team: killer?.findComponent(TeamMembership)?.team ?? null,
      killerId: killer?.id ?? null,
    });
    return camp;
  };
  return { state, spawn, announceSpawn, kill, run, payloads, destroyStructure, clearCamp };
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
      {
        entityId: warrior.id,
        amount: 20,
        victimId: minion.id,
        victimTeam: 'dark',
        cause: 'kill',
      },
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

  it.each([
    ['10 s after its hit, earns the kill XP', 10 * 30, 175],
    ['after the window, earns none', 30 * 30 + 1, 0],
  ])('the enemy whose hit a gem death is credited to, %s (DEC-346)', (_, wait, xp) => {
    const { state, spawn, run } = setUp();
    const damage = new DamagePipeline(undefined, new KillCredit(30 * 30, CATHEDRAL_GEM.statusIds));
    const enemy = spawn('warrior', 'warrior', 'light');
    const victim = spawn('magus', 'magus', 'dark');
    damage.apply(state, victim.id, 1, { attackerId: enemy.id, kind: 'weapon', definitionId: 'x' });
    for (let at = 0; at < wait; at += 1) state.advanceTick();

    damage.apply(state, victim.id, 1_000_000, {
      attackerId: null,
      kind: 'status',
      definitionId: 'gem-burn',
    });
    run();

    expect(enemy.getComponent(Progression).xp).toBe(xp);
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

  describe('structure destroyed (DEC-186)', () => {
    it('gives every Legend of the destroying team 300 XP, none to the other team', () => {
      const { spawn, run, payloads, destroyStructure } = setUp();
      const lights = [spawn('warrior', 'warrior', 'light'), spawn('magus', 'magus', 'light')];
      const dark = spawn('warrior', 'warrior', 'dark');

      destroyStructure('dark');
      run();

      expect(lights.map((l) => l.getComponent(Progression).xp)).toEqual([300, 300]);
      expect(dark.getComponent(Progression).xp).toBe(0);
      expect(payloads('xp-gained')).toEqual(
        lights.map((l) => ({
          entityId: l.id,
          amount: 300,
          victimId: 'entity-gone',
          victimTeam: 'dark',
          cause: 'structure-destroyed',
        })),
      );
    });

    it('pays a level-up from it, and skips minions and the destroyed side', () => {
      const { spawn, run, payloads, destroyStructure } = setUp();
      const warrior = spawn('warrior', 'warrior', 'light');
      const minion = spawn('light-mob', 'light-minion', 'light');

      destroyStructure('dark');
      run();

      // 300 XP on the test curve [100, 150, 200]: levels 2 (100) and 3 (250).
      expect(warrior.getComponent(Progression)).toMatchObject({ xp: 300, level: 3 });
      expect(minion.findComponent(Progression)).toBeUndefined();
      expect(payloads('level-up')).toEqual([
        { entityId: warrior.id, level: 2 },
        { entityId: warrior.id, level: 3 },
      ]);
    });

    it('pays nothing for a neutral structure', () => {
      const { spawn, run, payloads, destroyStructure } = setUp();
      const warrior = spawn('warrior', 'warrior', 'light');

      destroyStructure('neutral', 'camp');
      run();

      expect(warrior.getComponent(Progression).xp).toBe(0);
      expect(payloads('xp-gained')).toEqual([]);
    });

    it('pays nothing for a destroyed building (a map object emits no structure event)', () => {
      const { spawn, kill, run, payloads } = setUp();
      const warrior = spawn('warrior', 'warrior', 'light');

      kill(warrior, spawn('light-mob', 'training-dummy', 'dark'));
      run();

      expect(warrior.getComponent(Progression).xp).toBe(0);
      expect(payloads('xp-gained')).toEqual([]);
    });
  });

  describe('camp cleared (balancing.md "Camps")', () => {
    it('pays the Legend that killed the last mob the clear bonus, and nobody else', () => {
      const { spawn, run, payloads, clearCamp } = setUp();
      const clearer = spawn('warrior', 'warrior', 'light');
      const mate = spawn('magus', 'magus', 'light');
      const dark = spawn('warrior', 'warrior', 'dark');

      const camp = clearCamp(clearer);
      run();

      expect(clearer.getComponent(Progression).xp).toBe(50);
      expect(mate.getComponent(Progression).xp).toBe(0);
      expect(dark.getComponent(Progression).xp).toBe(0);
      expect(payloads('xp-gained')).toEqual([
        {
          entityId: clearer.id,
          amount: 50,
          victimId: camp.id,
          victimTeam: 'neutral',
          cause: 'camp-cleared',
        },
      ]);
    });

    it('pays no bonus when a minion or no known killer lands the last hit', () => {
      const { spawn, run, payloads, clearCamp } = setUp();
      const warrior = spawn('warrior', 'warrior', 'light');

      clearCamp(spawn('light-mob', 'light-minion', 'light'));
      clearCamp(null);
      run();

      expect(warrior.getComponent(Progression).xp).toBe(0);
      expect(payloads('xp-gained')).toEqual([]);
    });
  });

  describe('team kill (DEC-237)', () => {
    it("pays every Legend of the killer's team, capped at two levels, and none to the killer alone", () => {
      const { spawn, kill, run, payloads } = setUp();
      const killer = spawn('warrior', 'warrior', 'light');
      const mate = spawn('magus', 'magus', 'light');
      mate.getComponent(Progression).addXp(50, CURVES.get('legend'));
      const dark = spawn('warrior', 'warrior', 'dark');
      const boss = spawn('heavy-mob', 'capture-point-boss', 'neutral');

      kill(killer, boss);
      run();

      // 500 XP, but two levels at most on the test curve [100, 150, 200]: the start of level 3 (250).
      expect(killer.getComponent(Progression)).toMatchObject({ xp: 250, level: 3 });
      expect(mate.getComponent(Progression)).toMatchObject({ xp: 250, level: 3 });
      expect(dark.getComponent(Progression).xp).toBe(0);
      expect(payloads('xp-gained')).toEqual([
        {
          entityId: killer.id,
          amount: 250,
          victimId: boss.id,
          victimTeam: 'neutral',
          cause: 'team-kill',
        },
        {
          entityId: mate.id,
          amount: 200,
          victimId: boss.id,
          victimTeam: 'neutral',
          cause: 'team-kill',
        },
      ]);
    });

    it("pays the killing minion's team, and nothing for a death with no attacker", () => {
      const { spawn, kill, run } = setUp();
      const warrior = spawn('warrior', 'warrior', 'dark');

      kill(
        spawn('light-mob', 'light-minion', 'dark'),
        spawn('heavy-mob', 'capture-point-boss', 'neutral'),
      );
      kill(null, spawn('heavy-mob', 'capture-point-boss', 'neutral'));
      run();

      expect(warrior.getComponent(Progression)).toMatchObject({ xp: 250, level: 3 });
    });

    it('caps two levels up from partway through level 2', () => {
      const { spawn, kill, run } = setUp();
      const warrior = spawn('warrior', 'warrior', 'light');
      warrior.getComponent(Progression).addXp(100, CURVES.get('legend'));

      kill(warrior, spawn('heavy-mob', 'capture-point-boss', 'neutral'));
      run();

      // From level 2 the cap is level 4 (450 XP), 350 away: less than 500, so capped there.
      expect(warrior.getComponent(Progression)).toMatchObject({ xp: 450, level: 4 });
    });

    it('pays the full reward when two levels need more, and nothing at the level cap', () => {
      // Its own system on a curve with big steps; setUp's system is never run here.
      const { state, spawn, kill, payloads } = setUp();
      const bigSteps = new ContentCatalogue<LevelCurveDefinition>([
        { id: 'legend', cap: 4, xpToNext: [400, 400, 400] },
      ]);
      const system = new ProgressionSystem(state, {
        units: UNITS,
        curves: bigSteps,
        xpSources: XP_SOURCES,
      });
      const fresh = spawn('warrior', 'warrior', 'light');
      const capped = spawn('magus', 'magus', 'light');
      capped.getComponent(Progression).addXp(1200, bigSteps.get('legend'));

      const boss = spawn('heavy-mob', 'capture-point-boss', 'neutral');
      kill(fresh, boss);
      system.update({ state, logger: new NullLogger() });

      // Two levels on this curve take 800 XP, more than the 500 the boss pays.
      expect(fresh.getComponent(Progression)).toMatchObject({ xp: 500, level: 2 });
      expect(capped.getComponent(Progression).xp).toBe(1200);
      expect(payloads('xp-gained')).toEqual([
        {
          entityId: fresh.id,
          amount: 500,
          victimId: boss.id,
          victimTeam: 'neutral',
          cause: 'team-kill',
        },
      ]);
    });
  });

  describe('a Legend waiting to respawn (DEC-186 "pay on respawn")', () => {
    /** Takes `legend` out of the store into the respawn queue, as `RespawnSystem` and `DeathSystem` do. */
    const wait = (state: GameState, legend: Entity, team: 'light' | 'dark') => {
      state.respawns.add(legend as Legend, team, 300);
      state.entities.withdraw(legend.id, 'died');
    };
    const respawn = (state: GameState, legend: Entity) => {
      const [entry] = state.respawns.takeDue(300);
      state.entities.add(legend);
      state.events.emit('legend-respawned', {
        entityId: legend.id,
        team: 'light',
        position: { x: 0, y: 0 },
        owedXp: entry?.owedXp ?? [],
      });
    };

    it('owes it the structure XP while it waits and pays it, with its level-up, as it returns', () => {
      const { state, spawn, run, payloads, destroyStructure } = setUp();
      const waiting = spawn('warrior', 'warrior', 'light');
      const living = spawn('magus', 'magus', 'light');
      wait(state, waiting, 'light');

      destroyStructure('dark');
      run();

      expect(waiting.getComponent(Progression).xp).toBe(0);
      expect(living.getComponent(Progression).xp).toBe(300);
      let owed: unknown[] = [];
      state.respawns.forEach(({ owedXp }) => (owed = [...owedXp]));
      expect(owed).toEqual([
        { cause: 'structure-destroyed', victimId: 'entity-gone', victimTeam: 'dark', xp: 300 },
      ]);

      respawn(state, waiting);

      // The listener only buffers; the pass of the next tick pays.
      expect(waiting.getComponent(Progression).xp).toBe(0);
      run();

      expect(waiting.getComponent(Progression)).toMatchObject({ xp: 300, level: 3 });
      expect(payloads('xp-gained').at(-1)).toEqual({
        entityId: waiting.id,
        amount: 300,
        victimId: 'entity-gone',
        victimTeam: 'dark',
        cause: 'respawn',
      });
      expect(payloads('level-up').slice(-2)).toEqual([
        { entityId: waiting.id, level: 2 },
        { entityId: waiting.id, level: 3 },
      ]);
    });

    it('owes it a kill its hit landed after it died, and a boss its team killed, capped as it returns', () => {
      const { state, spawn, kill, run } = setUp();
      const waiting = spawn('warrior', 'warrior', 'light');
      const mate = spawn('magus', 'magus', 'light');
      const minion = spawn('light-mob', 'light-minion', 'dark');
      const boss = spawn('heavy-mob', 'capture-point-boss', 'neutral');
      wait(state, waiting, 'light');

      kill(waiting, minion);
      kill(mate, boss);
      run();
      respawn(state, waiting);
      run();

      // The minion's XP, then the boss's 500 capped at two levels up (250 XP in all on this curve).
      expect(waiting.getComponent(Progression)).toMatchObject({ xp: 250, level: 3 });
      expect(mate.getComponent(Progression).xp).toBe(250);
      expect(
        state
          .xpAwardsThisTick()
          .filter((award) => award.entityId === waiting.id)
          .map((award) => [award.amount, award.victimId, award.cause]),
      ).toEqual([
        [LIGHT_MINION.xpValue, minion.id, 'respawn'],
        [250 - LIGHT_MINION.xpValue, boss.id, 'respawn'],
      ]);
    });

    it("owes it a camp's clear bonus when its hit killed the last mob after it died (O4)", () => {
      const { state, spawn, run, payloads, clearCamp } = setUp();
      const waiting = spawn('warrior', 'warrior', 'light');
      wait(state, waiting, 'light');

      const camp = clearCamp(waiting);
      run();

      let owed: unknown[] = [];
      state.respawns.forEach(({ owedXp }) => (owed = [...owedXp]));
      expect(owed).toEqual([
        { cause: 'camp-cleared', victimId: camp.id, victimTeam: 'neutral', xp: 50 },
      ]);

      respawn(state, waiting);
      run();

      expect(waiting.getComponent(Progression).xp).toBe(50);
      expect(payloads('xp-gained').at(-1)).toMatchObject({
        entityId: waiting.id,
        amount: 50,
        victimId: camp.id,
        cause: 'respawn',
      });
    });

    it('pays nothing to a waiting Legend of the other team', () => {
      const { state, spawn, run, destroyStructure } = setUp();
      const waiting = spawn('warrior', 'warrior', 'dark');
      wait(state, waiting, 'dark');

      destroyStructure('dark');
      run();

      let owed = -1;
      state.respawns.forEach(({ owedXp }) => (owed = owedXp.length));
      expect(owed).toBe(0);
    });
  });
});

describe('ProgressionSystem with legendsStartAtMaxLevel (a Duel, SCRUM-444)', () => {
  /** The short curve's cap is 4, so a raise to the cap is 3 levels (100 + 150 + 200 = 450 XP). */
  const LEVELS_RAISED = 3;

  it("raises a spawned Legend to its curve's cap with each level's raises, at full health", () => {
    const { spawn, announceSpawn } = setUp(true);
    const warrior = spawn('warrior', 'warrior', 'light');
    const health = warrior.getComponent(Health);
    const aether = warrior.getComponent(Aether);
    const [maxHealth, maxAether] = [health.max, aether.max];

    announceSpawn(warrior, 'light');

    expect(warrior.getComponent(Progression)).toMatchObject({ level: 4, xp: 450 });
    const raise = WARRIOR.baseHealth * WARRIOR.levelScaling.healthPerLevel * LEVELS_RAISED;
    expect(health.max).toBeCloseTo(maxHealth + raise);
    expect(health.current).toBeCloseTo(health.max);
    expect(aether.max).toBe(maxAether + WARRIOR.levelScaling.aetherPerLevel * LEVELS_RAISED);
    expect(aether.current).toBe(aether.max);
  });

  it('announces no award: no xp-gained and no level-up', () => {
    const { spawn, announceSpawn, run, payloads } = setUp(true);
    const warrior = spawn('warrior', 'warrior', 'light');
    announceSpawn(warrior, 'light');
    run();

    expect(warrior.getComponent(Progression).level).toBe(4);
    expect(payloads('xp-gained')).toEqual([]);
    expect(payloads('level-up')).toEqual([]);
  });

  it('leaves a mob as it is', () => {
    const { spawn, announceSpawn } = setUp(true);
    const minion = spawn('light-mob', 'light-minion', 'light');
    const maxHealth = minion.getComponent(Health).max;

    expect(() => {
      announceSpawn(minion, 'light');
    }).not.toThrow();
    expect(minion.getComponent(Health).max).toBe(maxHealth);
  });

  it('raises nothing more when a Legend at the cap spawns again', () => {
    const { spawn, announceSpawn } = setUp(true);
    const warrior = spawn('warrior', 'warrior', 'light');
    announceSpawn(warrior, 'light');
    const [maxHealth, maxAether] = [
      warrior.getComponent(Health).max,
      warrior.getComponent(Aether).max,
    ];

    announceSpawn(warrior, 'light');

    expect(warrior.getComponent(Progression)).toMatchObject({ level: 4, xp: 450 });
    expect(warrior.getComponent(Health).max).toBe(maxHealth);
    expect(warrior.getComponent(Aether).max).toBe(maxAether);
  });

  it('keeps a spawned Legend at level 1 without the rule', () => {
    const { spawn, announceSpawn } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');

    announceSpawn(warrior, 'light');

    expect(warrior.getComponent(Progression)).toMatchObject({ level: 1, xp: 0 });
  });
});
