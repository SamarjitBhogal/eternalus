import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { ContentCatalogue } from './content/ContentCatalogue';
import { DUEL_RULES } from './content/duel/duelRules';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { runReplay } from './diagnostics/replay';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { DuelOptions, RosterSlot } from './Simulation.types';
import type { Snapshot } from './state/Snapshot.types';
import type { PlayableTeam } from './teams/teams.types';

const ROSTER: readonly RosterSlot[] = (['light', 'dark'] as const).map((team) => ({
  pilot: 'human',
  team,
  definitionId: 'warrior',
  role: 'rover',
}));

const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
const map = new MapGenerator().generate(config, 7);
const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
const cathedral = map.features.find((feature) => feature.kind === 'cathedral')?.position;

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

const legendOf = (sim: Simulation, snapshot: Snapshot, team: PlayableTeam) => {
  const id = sim.humanLegendIdOf(team);
  const legend = snapshot.entities.find((entity) => entity.id === id);
  if (id === null || legend === undefined) throw new Error(`No ${team} Legend`);
  return { id, legend };
};

/** Steps until `done` holds (at most `limit` ticks), the light Legend walking at the dark one and hitting it. */
const fightUntil = (sim: Simulation, done: (snapshot: Snapshot) => boolean, limit = 6000) => {
  for (let i = 0; i < limit && !done(sim.snapshot()); i += 1) {
    const snapshot = sim.snapshot();
    const { id: light, legend: from } = legendOf(sim, snapshot, 'light');
    const { id: dark, legend: to } = legendOf(sim, snapshot, 'dark');
    const direction = { x: Math.sign((to.transform?.x ?? 0) - (from.transform?.x ?? 0)), y: 0 };
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

  it('has no duel in the snapshot of an ordinary match', () => {
    const sim = new Simulation({ config, seed: 7, logger: new NullLogger(), map, mapObjects });

    expect(sim.snapshot().match.duel).toBeUndefined();
  });

  it('counts a kill and resets both Legends to their start points at full health', () => {
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
  });

  it('ends the match for the first team to reach the kill target', () => {
    const sim = build({ killTarget: 2 });
    let result: { winner: PlayableTeam | null; condition: string } | null = null;
    sim.on('match-ended', (event) => {
      result = event.result;
    });

    const after = fightUntil(sim, () => result !== null);

    expect(after.match.duel?.kills.light).toBe(2);
    expect(result).toMatchObject({ winner: 'light', condition: 'kill-count' });
  });

  it('replays to the same hashes from its setup and commands', () => {
    const sim = build({ killTarget: 1 });
    fightUntil(sim, (snapshot) => snapshot.match.duel?.kills.light === 1);

    const replay = sim.exportReplay();

    expect(replay.duel).toEqual({ killTarget: 1 });
    expect(
      runReplay(replay, (setup) => new Simulation({ ...setup, logger: new NullLogger() }))
        .firstDivergence,
    ).toBeNull();
  });

  it('spawns no minions or other mobs, while an ordinary match does (SCRUM-445)', () => {
    const mobsAfter = (sim: Simulation, ticks: number) => {
      for (let i = 0; i < ticks; i += 1) sim.step();
      return sim.snapshot().entities.filter(({ kind }) => kind.endsWith('-mob'));
    };
    const ordinary = new Simulation({ config, seed: 7, logger: new NullLogger(), map, mapObjects });
    const ticks = 10 * config.tickRate;

    expect(mobsAfter(build(), ticks)).toEqual([]);
    expect(mobsAfter(ordinary, ticks).length).toBeGreaterThan(0);
  });

  it('builds no structure the arena omits, while an ordinary match does (SCRUM-447)', () => {
    const structures = new ContentCatalogue([
      ...STRUCTURE_DEFINITIONS.all(),
      {
        id: 'cathedral',
        kind: 'camp', // a registered kind: the gem's own kind is not on this branch
        displayName: 'Cathedral',
        baseHealth: 1, // TUNE: test double
        footprintRadius: 1,
        breakability: { kind: 'never' },
      },
    ] as const);
    const cathedrals = (sim: Simulation) =>
      sim.snapshot().entities.filter(({ definitionId }) => definitionId === 'cathedral');
    const ordinary = new Simulation({
      config,
      seed: 7,
      logger: new NullLogger(),
      map,
      mapObjects,
      structures,
    });
    const duel = new Simulation({
      config,
      seed: 7,
      logger: new NullLogger(),
      map,
      mapObjects,
      roster: ROSTER,
      duel: { killTarget: 2 },
      structures,
    });

    expect(DUEL_RULES.arena.omittedStructureIds).toContain('cathedral');
    expect(cathedrals(ordinary).length).toBeGreaterThan(0);
    expect(cathedrals(duel)).toEqual([]);
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

  it('refuses a Duel without a map', () => {
    expect(
      () => new Simulation({ config, seed: 1, logger: new NullLogger(), duel: { killTarget: 1 } }),
    ).toThrow('Duel');
  });
});
