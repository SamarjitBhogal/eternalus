import { describe, expect, it } from 'vitest';

import { unitsWithWarriorKit } from './abilities/__fixtures__/casterState';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { DUEL_RULES } from './content/duel/duelRules';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { runReplay } from './diagnostics/replay';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { DuelOptions, RosterSlot } from './Simulation.types';
import type { DefinitionSource } from './entities/EntityFactory.types';
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

/**
 * Steps until `done` holds (at most `limit` ticks), the light Legend walking at the dark one and
 * hitting it. One snapshot per tick: a whole-map snapshot is the test's largest cost.
 */
const fightUntil = (sim: Simulation, done: (snapshot: Snapshot) => boolean, limit = 6000) => {
  let snapshot = sim.snapshot();
  for (let i = 0; i < limit && !done(snapshot); i += 1) {
    const { id: light, legend: from } = legendOf(sim, snapshot, 'light');
    const { id: dark, legend: to } = legendOf(sim, snapshot, 'dark');
    const direction = { x: Math.sign((to.transform?.x ?? 0) - (from.transform?.x ?? 0)), y: 0 };
    sim.enqueueCommand({ type: 'move', actorId: light, direction });
    sim.enqueueCommand({ type: 'attack-target', actorId: light, targetId: dark });
    sim.step();
    snapshot = sim.snapshot();
  }
  return snapshot;
};

/** Steps both Legends at each other, without attacking, until they are `distance` apart or less. */
const walkUpTo = (sim: Simulation, distance: number, limit = 6000) => {
  const light = sim.humanLegendIdOf('light') ?? '';
  const dark = sim.humanLegendIdOf('dark') ?? '';
  const gap = () => {
    const snapshot = sim.snapshot();
    const from = legendOf(sim, snapshot, 'light').legend.transform;
    const to = legendOf(sim, snapshot, 'dark').legend.transform;
    return (to?.x ?? 0) - (from?.x ?? 0);
  };
  for (let i = 0, x = gap(); i < limit && Math.abs(x) > distance; i += 1, x = gap()) {
    sim.enqueueCommand({ type: 'move', actorId: light, direction: { x: Math.sign(x), y: 0 } });
    sim.enqueueCommand({ type: 'move', actorId: dark, direction: { x: -Math.sign(x), y: 0 } });
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

  it('ends Fury at the round reset, so its dash leaves the granted slot (every invariant checked)', () => {
    // A Vanguard against a one-health Magus: each hit is a kill, and four kills fill the meter
    // (a Legend kill gives 25, DEC-272).
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
