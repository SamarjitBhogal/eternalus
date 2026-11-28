import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

/**
 * The player's Knight, a light bot Oracle, a dark bot Juggernaut and a dark bot whose slot names
 * no spec, as the client's `rosterSlots` passes them (DEC-378 (2)).
 */
const ROSTER: readonly RosterSlot[] = [
  { pilot: 'human', team: 'light', definitionId: 'warrior', role: 'rover', specId: 'knight' },
  {
    pilot: 'bot',
    team: 'light',
    definitionId: 'magus',
    role: 'laner',
    difficulty: 'normal',
    specId: 'oracle',
  },
  {
    pilot: 'bot',
    team: 'dark',
    definitionId: 'sentinel',
    role: 'rover',
    difficulty: 'rover',
    specId: 'juggernaut',
  },
  { pilot: 'bot', team: 'dark', definitionId: 'warrior', role: 'laner', difficulty: 'normal' },
];

const match = (roster: readonly RosterSlot[] = ROSTER) =>
  new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map: TWO_LANE_MAP,
    roster,
  });

/** Each Legend's team, class and the spec its snapshot names (`undefined` when it names none). */
const legendSpecs = (simulation: Simulation) =>
  simulation
    .snapshot()
    .entities.filter(({ family }) => family === 'legend')
    .map(({ team, definitionId, specId }) => ({ team, definitionId, specId }));

describe('Simulation with Legend specs (DEC-378)', () => {
  it("names each roster Legend's spec in its snapshot, the bots' and the human's alike", () => {
    const simulation = match();

    expect(legendSpecs(simulation)).toEqual(
      expect.arrayContaining([
        { team: 'light', definitionId: 'warrior', specId: 'knight' },
        { team: 'light', definitionId: 'magus', specId: 'oracle' },
        { team: 'dark', definitionId: 'sentinel', specId: 'juggernaut' },
        { team: 'dark', definitionId: 'warrior', specId: undefined },
      ]),
    );
    expect(legendSpecs(simulation)).toHaveLength(4);
    const human = simulation.snapshot().match.humanLegendId;
    const own = simulation.snapshot().entities.find(({ id }) => id === human);
    expect(own?.specId).toBe('knight');
  });

  it('keeps the spec in the snapshot as the match plays', () => {
    const simulation = match();
    for (let tick = 0; tick < 60; tick += 1) {
      simulation.step();
    }

    expect(
      legendSpecs(simulation)
        .map(({ specId }) => specId)
        .sort(),
    ).toEqual(['juggernaut', 'knight', 'oracle', undefined]);
  });

  it('plays the same seed and roster with specs to the same hash twice', () => {
    const hashes = [1, 2].map(() => {
      const simulation = match();
      for (let tick = 0; tick < 90; tick += 1) {
        simulation.step();
      }
      return simulation.hash();
    });

    expect(hashes[0]).toBe(hashes[1]);
  });

  it('carries the specs in the replay setup, so a replay names the same Legends', () => {
    const replay = match().exportReplay();

    expect(replay.roster?.map((slot) => slot.specId)).toEqual([
      'knight',
      'oracle',
      'juggernaut',
      undefined,
    ]);
  });
});
