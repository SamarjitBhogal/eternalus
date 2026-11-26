import { describe, expect, it } from 'vitest';

import { unitsWithWarriorKit } from './abilities/__fixtures__/casterState';
import { stepPastCountdown } from './abilities/__fixtures__/stepPastCountdown';
import { DamagePipeline } from './combat/DamagePipeline';
import { Health } from './components/Health';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { DUEL_RULES } from './content/duel/duelRules';
import { LEGEND_LEVEL_CURVE } from './content/progression/levelCurves';
import { LEGEND_RESPAWN_SECONDS } from './content/progression/legendRespawn';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { runReplay } from './diagnostics/replay';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { DuelOptions, RosterSlot } from './Simulation.types';
import type { DefinitionSource } from './entities/EntityFactory.types';
import type { GameState } from './state/GameState';
import type { Snapshot } from './state/Snapshot.types';
import type { PlayableTeam } from './teams/teams.types';
import { TickRate } from './utils/TickRate';
import type { Vec2 } from './utils/geometry.types';

const ROSTER: readonly RosterSlot[] = (['light', 'dark'] as const).map((team) => ({
  pilot: 'human',
  team,
  definitionId: 'warrior',
  role: 'rover',
}));

const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
const map = new MapGenerator().generate(config, 7);
const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
const cathedralFeature = map.features.find((feature) => feature.kind === 'cathedral');
const cathedral = cathedralFeature?.position;
const cathedralId = cathedralFeature?.id;

const build = (duel: DuelOptions = { killTarget: 2 }) =>
  new Simulation({
    config,
    seed: 7,
    logger: new NullLogger(),
    debug: TEST_DEBUG_CONFIG,
    map,
    mapObjects,
    roster: ROSTER,
    duel,
  });

/** A fight between two max-level Legends (SCRUM-444) runs thousands of ticks, longer under coverage. */
const FIGHT_TIMEOUT_MS = 180_000;

const legendOf = (sim: Simulation, snapshot: Snapshot, team: PlayableTeam) => {
  const id = sim.humanLegendIdOf(team);
  const legend = snapshot.entities.find((entity) => entity.id === id);
  if (id === null || legend === undefined) throw new Error(`No ${team} Legend`);
  return { id, legend };
};

/** How far either side of the gem the walker below steps south to go round it (DEC-346). */
const ROUND_THE_GEM = 15;

/**
 * Steps until `done` holds (at most `limit` ticks), the light Legend walking at the dark one and
 * hitting it. The gem between the start points blocks movement (DEC-346), so near it the walker
 * also steps south and slides round it.
 */
const fightUntil = (sim: Simulation, done: (snapshot: Snapshot) => boolean, limit = 6000) => {
  for (let i = 0; i < limit && !done(sim.snapshot()); i += 1) {
    const snapshot = sim.snapshot();
    const { id: light, legend: from } = legendOf(sim, snapshot, 'light');
    const { id: dark, legend: to } = legendOf(sim, snapshot, 'dark');
    const at = { x: from.transform?.x ?? 0, y: from.transform?.y ?? 0 };
    const isByTheGem = Math.abs(at.x - (cathedral?.x ?? 0)) < ROUND_THE_GEM;
    const direction = {
      x: Math.sign((to.transform?.x ?? 0) - at.x),
      y: isByTheGem ? 1 : Math.sign((to.transform?.y ?? 0) - at.y),
    };
    sim.enqueueCommand({ type: 'move', actorId: light, direction });
    sim.enqueueCommand({ type: 'attack-target', actorId: light, targetId: dark });
    sim.step();
  }
  return sim.snapshot();
};

/**
 * Steps both Legends at each other, without attacking, until they are `distance` apart or less.
 * Near the gem (DEC-346) each one also steps south, as in `fightUntil`, and slides round it.
 */
const walkUpTo = (sim: Simulation, distance: number, limit = 6000) => {
  const light = sim.humanLegendIdOf('light') ?? '';
  const dark = sim.humanLegendIdOf('dark') ?? '';
  const towards = (from: Vec2, to: Vec2): Vec2 => ({
    x: Math.sign(to.x - from.x),
    y: Math.abs(from.x - (cathedral?.x ?? 0)) < ROUND_THE_GEM ? 1 : Math.sign(to.y - from.y),
  });
  for (let i = 0; i < limit; i += 1) {
    const snapshot = sim.snapshot();
    const from = legendOf(sim, snapshot, 'light').legend.transform ?? { x: 0, y: 0 };
    const to = legendOf(sim, snapshot, 'dark').legend.transform ?? { x: 0, y: 0 };
    if (Math.hypot(to.x - from.x, to.y - from.y) <= distance) break;
    sim.enqueueCommand({ type: 'move', actorId: light, direction: towards(from, to) });
    sim.enqueueCommand({ type: 'move', actorId: dark, direction: towards(to, from) });
    sim.step();
  }
  sim.enqueueCommand({ type: 'stop', actorId: light });
  sim.enqueueCommand({ type: 'stop', actorId: dark });
  sim.step();
};

describe('Simulation: a Duel', () => {
  it('starts both Legends in the Cathedral, light west and dark east, and no kills', () => {
    const sim = build();
    const snapshot = sim.snapshot();

    expect(cathedral).toBeDefined();
    expect(legendOf(sim, snapshot, 'light').legend.transform).toMatchObject({
      x: (cathedral?.x ?? 0) - DUEL_RULES.startOffset,
      y: cathedral?.y,
    });
    expect(legendOf(sim, snapshot, 'dark').legend.transform).toMatchObject({
      x: (cathedral?.x ?? 0) + DUEL_RULES.startOffset,
      y: cathedral?.y,
    });
    expect(snapshot.match.duel).toEqual({ kills: { light: 0, dark: 0 }, killTarget: 2 });
  });

  it('starts both Legends at max level (SCRUM-444)', () => {
    const duel = build();
    const ordinary = new Simulation({
      config,
      seed: 7,
      logger: new NullLogger(),
      debug: TEST_DEBUG_CONFIG,
      map,
      mapObjects,
      roster: ROSTER,
    });
    for (const sim of [duel, ordinary]) {
      for (let i = 0; i < 10; i += 1) sim.step();
    }
    const duelSnapshot = duel.snapshot();
    const ordinarySnapshot = ordinary.snapshot();

    for (const team of ['light', 'dark'] as const) {
      const { legend } = legendOf(duel, duelSnapshot, team);
      const usual = legendOf(ordinary, ordinarySnapshot, team).legend;
      expect(legend.progression).toMatchObject({ level: LEGEND_LEVEL_CURVE.cap, xpToNext: null });
      expect(usual.progression?.level).toBe(1);
      expect(legend.health?.max).toBeGreaterThan(usual.health?.max ?? Infinity);
      expect(legend.health?.current).toBe(legend.health?.max);
      expect(legend.aether?.max).toBeGreaterThan(usual.aether?.max ?? Infinity);
    }
  });

  it('starts each Legend with its ultimate meter half full, an ordinary match with it empty (DEC-380 (1))', () => {
    const duel = build();
    const ordinary = new Simulation({
      config,
      seed: 7,
      logger: new NullLogger(),
      debug: TEST_DEBUG_CONFIG,
      map,
      mapObjects,
      roster: ROSTER,
    });
    const charged: string[] = [];
    for (const sim of [duel, ordinary]) {
      sim.on('ultimate-charged', ({ entityId, charge, cause }) => {
        charged.push(`${entityId} ${cause} ${String(charge)}`);
      });
      stepPastCountdown(sim);
    }
    const ultimateOf = (sim: Simulation) =>
      sim.snapshot().player?.slots.find(({ slot }) => slot === 'ability-4')?.charge;

    expect(ultimateOf(duel)).toBe(0.5); // the owner's "starts half-charged"
    expect(ultimateOf(ordinary)).toBe(0);
    expect(charged).toEqual(
      (['light', 'dark'] as const).map((team) => `${duel.humanLegendIdOf(team) ?? ''} start 0.5`),
    );
  });

  it('starts every other ability ready when the Duel starts: no cooldown before a cast (DEC-380 (1))', () => {
    const sim = build();
    stepPastCountdown(sim);

    const others = sim
      .snapshot()
      .player?.slots.filter(({ slot }) => ['ability-1', 'ability-2', 'ability-3'].includes(slot));
    expect(others?.map(({ cooldownRemainingTicks }) => cooldownRemainingTicks)).toEqual([0, 0, 0]);
    expect(others?.some(({ blockedBy }) => blockedBy === 'on-cooldown')).toBe(false);
  });

  it('has no duel in the snapshot of an ordinary match', () => {
    const sim = new Simulation({ config, seed: 7, logger: new NullLogger(), map, mapObjects });

    expect(sim.snapshot().match.duel).toBeUndefined();
  });

  it(
    'counts a kill and resets both Legends to their start points at full health',
    () => {
      const sim = build();
      const before = sim.snapshot();
      const after = fightUntil(sim, (snapshot) => (snapshot.match.duel?.kills.light ?? 0) > 0);

      expect(after.match.duel?.kills).toEqual({ light: 1, dark: 0 });
      expect(after.match.phase).not.toBe('victory');
      for (const team of ['light', 'dark'] as const) {
        const { legend } = legendOf(sim, after, team);
        expect(legend.health?.current).toBe(legend.health?.max);
        expect(legend.transform).toMatchObject({
          x: legendOf(sim, before, team).legend.transform?.x,
          y: legendOf(sim, before, team).legend.transform?.y,
        });
      }
    },
    FIGHT_TIMEOUT_MS,
  );

  it(
    'never queues a fallen Duel Legend to respawn: the round reset runs first, past the respawn delay too',
    () => {
      const sim = build({ killTarget: 5 });
      const ids = (['light', 'dark'] as const).map((team) => sim.humanLegendIdOf(team));
      const left: string[] = [];
      const returned: string[] = [];
      sim.on('entity-removed', ({ entityId }) => {
        if (ids.includes(entityId)) left.push(entityId);
      });
      sim.on('legend-respawned', ({ entityId }) => returned.push(entityId));

      fightUntil(sim, (snapshot) => (snapshot.match.duel?.kills.light ?? 0) > 0);
      const delay = new TickRate(config.tickRate).toTicks(LEGEND_RESPAWN_SECONDS);
      for (let tick = 0; tick <= delay + 30; tick += 1) sim.step();

      expect(left).toEqual([]);
      expect(returned).toEqual([]);
      for (const team of ['light', 'dark'] as const) {
        expect(legendOf(sim, sim.snapshot(), team).legend.health?.current).toBeGreaterThan(0);
      }
    },
    FIGHT_TIMEOUT_MS,
  );

  it(
    'ends the match for the first team to reach the kill target',
    () => {
      const sim = build({ killTarget: 2 });
      let result: { winner: PlayableTeam | null; condition: string } | null = null;
      sim.on('match-ended', (event) => {
        result = event.result;
      });

      const after = fightUntil(sim, () => result !== null);

      expect(after.match.duel?.kills.light).toBe(2);
      expect(result).toMatchObject({ winner: 'light', condition: 'kill-count' });
    },
    FIGHT_TIMEOUT_MS,
  );

  it(
    'replays to the same hashes from its setup and commands',
    () => {
      const sim = build({ killTarget: 1 });
      fightUntil(sim, (snapshot) => snapshot.match.duel?.kills.light === 1);

      const replay = sim.exportReplay();

      expect(replay.duel).toEqual({ killTarget: 1 });
      expect(
        runReplay(replay, (setup) => new Simulation({ ...setup, logger: new NullLogger() }))
          .firstDivergence,
      ).toBeNull();
    },
    FIGHT_TIMEOUT_MS,
  );

  it('spawns no minions, host units or other mobs, while an ordinary match does (SCRUM-445, DEC-348)', () => {
    const mobsAfter = (sim: Simulation, ticks: number) => {
      for (let i = 0; i < ticks; i += 1) sim.step();
      return sim.snapshot().entities.filter(({ kind }) => kind.endsWith('-mob'));
    };
    const ordinary = new Simulation({ config, seed: 7, logger: new NullLogger(), map, mapObjects });
    const ticks = 10 * config.tickRate;

    expect(mobsAfter(build(), ticks)).toEqual([]);
    expect(mobsAfter(ordinary, ticks).length).toBeGreaterThan(0);
  });

  it('keeps the Cathedral gem, while building no tower, gate, camp or Stronghold (DEC-348)', () => {
    const structures = STRUCTURE_DEFINITIONS;
    const builtIds = (sim: Simulation) =>
      new Set(
        sim
          .snapshot()
          .entities.filter(({ family }) => family === 'structure')
          .map(({ definitionId }) => definitionId),
      );
    const options = { config, seed: 7, logger: new NullLogger(), map, mapObjects, structures };
    const ordinary = builtIds(new Simulation(options));
    const duel = builtIds(new Simulation({ ...options, roster: ROSTER, duel: { killTarget: 2 } }));

    expect(DUEL_RULES.arena.omittedStructureIds).not.toContain('cathedral');
    expect(ordinary).toEqual(new Set(STRUCTURE_DEFINITIONS.all().map(({ id }) => id)));
    expect(ordinary).toContain('cathedral');
    expect(duel).toEqual(new Set(['cathedral']));
  });

  it("leaves no structure's map object and nothing a side built, but keeps trees, houses and rocks (DEC-348)", () => {
    const kept = (sim: Simulation) => {
      const ids = new Set((sim.snapshot().mapObjects ?? []).map(({ id }) => id));
      return mapObjects.filter(({ id }) => ids.has(id));
    };
    const duel = kept(build());

    expect(duel.filter(({ team }) => team !== undefined)).toEqual([]);
    expect(duel.filter(({ kind }) => DUEL_RULES.arena.omittedObjectKinds.includes(kind))).toEqual(
      [],
    );
    for (const kind of ['tree', 'house', 'rock', 'wall'] as const) {
      expect(duel.filter((object) => object.kind === kind).length).toBeGreaterThan(0);
    }
  });

  it("makes the Cathedral's walls unbreakable in a Duel, while a normal match's still break (DEC-348)", () => {
    const wallDamage = (sim: Simulation) => {
      const { state } = sim as unknown as { readonly state: GameState };
      const wall = mapObjects.find(
        ({ kind, buildingId }) => kind === 'wall' && buildingId === cathedralId,
      );
      const wallId = (sim.snapshot().mapObjects ?? []).find(({ id }) => id === wall?.id)?.entityId;
      if (wallId === undefined || wallId === null) throw new Error('No Cathedral wall');
      const before = state.entities.get(wallId)?.findComponent(Health)?.current;
      new DamagePipeline().apply(state, wallId, 100, {
        attackerId: 'entity-9',
        kind: 'weapon',
        definitionId: 'sword',
      });
      return (before ?? 0) - (state.entities.get(wallId)?.findComponent(Health)?.current ?? 0);
    };

    expect(wallDamage(build())).toBe(0);
    expect(
      wallDamage(new Simulation({ config, seed: 7, logger: new NullLogger(), map, mapObjects })),
    ).toBe(100);
  });

  it('has no capture objectives, while an ordinary match does (SCRUM-446)', () => {
    const objectives = (snapshot: Snapshot) => snapshot.entities.filter(({ capture }) => capture);
    const ordinary = new Simulation({ config, seed: 7, logger: new NullLogger(), map, mapObjects });

    expect(objectives(build().snapshot())).toEqual([]);
    expect(objectives(ordinary.snapshot()).length).toBeGreaterThan(0);
  });

  it('keeps both Legends inside the Cathedral, its side entrances closed (SCRUM-450)', () => {
    const doors = mapObjects.filter(({ isDuelBarrier }) => isDuelBarrier === true);
    const xsOf = (id: string) =>
      doors
        .find((door) => door.id === id)
        ?.footprints.flat()
        .map(({ x }) => x) ?? [];
    const sim = build();
    for (let i = 0; i < 20 * config.tickRate; i += 1) {
      for (const [team, x] of [
        ['light', -1],
        ['dark', 1],
      ] as const) {
        const actorId = legendOf(sim, sim.snapshot(), team).id;
        sim.enqueueCommand({ type: 'move', actorId, direction: { x, y: 0 } });
      }
      sim.step();
    }
    const after = sim.snapshot();

    expect(doors.map(({ isBlocking }) => isBlocking)).toEqual([false, false, false, false]);
    expect(legendOf(sim, after, 'light').legend.transform?.x).toBeGreaterThan(
      Math.min(...xsOf('cathedral-interior-west-door')),
    );
    expect(legendOf(sim, after, 'dark').legend.transform?.x).toBeLessThan(
      Math.max(...xsOf('cathedral-interior-east-door')),
    );
  });

  it('runs a Duel against a bot with no Strongholds, every invariant holding (DEC-348)', () => {
    const sim = new Simulation({
      config,
      seed: 7,
      logger: new NullLogger(),
      debug: TEST_DEBUG_CONFIG,
      map,
      mapObjects,
      roster: [
        { pilot: 'human', team: 'light', definitionId: 'warrior', role: 'rover' },
        {
          pilot: 'bot',
          difficulty: 'normal',
          team: 'dark',
          definitionId: 'warrior',
          role: 'rover',
        },
      ],
      duel: { killTarget: 2 },
    });

    expect(() => {
      for (let i = 0; i < 20 * config.tickRate; i += 1) sim.step();
    }).not.toThrow();
    expect(sim.snapshot().entities.filter(({ kind }) => kind === 'stronghold')).toEqual([]);
  });

  it('ends Fury at the round reset, so its dash leaves the granted slot (every invariant checked)', () => {
    // A Vanguard against a one-health Magus: each hit is a kill. The meter starts half full
    // (DEC-380 (1)) and a Legend kill gives 25 (DEC-272), so the first two of the four kills
    // below fill it.
    const shipped = unitsWithWarriorKit();
    const content: DefinitionSource = {
      has: (id) => shipped.has(id),
      get: (id) => (id === 'magus' ? { ...shipped.get(id), baseHealth: 1 } : shipped.get(id)),
    };
    const sim = new Simulation({
      config,
      seed: 7,
      logger: new NullLogger(),
      debug: TEST_DEBUG_CONFIG,
      map,
      mapObjects,
      roster: ROSTER.map((slot) =>
        slot.team === 'dark' ? { ...slot, definitionId: 'magus' } : slot,
      ),
      duel: { killTarget: 10 },
      content,
    });
    const vanguard = sim.humanLegendIdOf('light') ?? '';
    const log: string[] = [];
    sim.on('status-applied', ({ entityId, statusId }) => log.push(`${statusId} on ${entityId}`));
    sim.on('status-expired', ({ entityId, statusId }) => log.push(`${statusId} off ${entityId}`));
    sim.on('command-rejected', ({ reason }) => log.push(`rejected ${reason}`));
    const kills = (snapshot: Snapshot) => snapshot.match.duel?.kills.light ?? 0;
    const castSlot = (slot: 'ability-4' | 'granted') => {
      sim.enqueueCommand({
        type: 'cast-ability',
        actorId: vanguard,
        slot,
        aim: { point: { x: 0, y: 0 }, targetId: null },
      });
      sim.step();
    };

    for (let kill = 1; kill <= 4; kill += 1) {
      walkUpTo(sim, 3);
      fightUntil(sim, (snapshot) => kills(snapshot) >= kill, 60);
    }
    walkUpTo(sim, 3);
    castSlot('ability-4');
    const furyOn = log.length;
    fightUntil(sim, (snapshot) => kills(snapshot) >= 5, 60); // the reset falls inside Fury's 8 s
    castSlot('granted');

    expect(kills(sim.snapshot())).toBe(5);
    expect(log.slice(furyOn - 1)).toEqual([
      `fury on ${vanguard}`,
      `fury off ${vanguard}`,
      'rejected empty-slot',
    ]);
  });

  it('refuses a Duel without a map', () => {
    expect(
      () => new Simulation({ config, seed: 1, logger: new NullLogger(), duel: { killTarget: 1 } }),
    ).toThrow('Duel');
  });
});
