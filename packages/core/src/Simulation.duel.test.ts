import { describe, expect, it } from 'vitest';

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

  it('refuses a Duel without a map', () => {
    expect(
      () => new Simulation({ config, seed: 1, logger: new NullLogger(), duel: { killTarget: 1 } }),
    ).toThrow('Duel');
  });
});
