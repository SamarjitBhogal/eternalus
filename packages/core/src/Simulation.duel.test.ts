import { describe, expect, it } from 'vitest';

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
import type { GameState } from './state/GameState';
import type { Snapshot } from './state/Snapshot.types';
import type { PlayableTeam } from './teams/teams.types';
import { TickRate } from './utils/TickRate';

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

  it('refuses a Duel without a map', () => {
    expect(
      () => new Simulation({ config, seed: 1, logger: new NullLogger(), duel: { killTarget: 1 } }),
    ).toThrow('Duel');
  });
});
