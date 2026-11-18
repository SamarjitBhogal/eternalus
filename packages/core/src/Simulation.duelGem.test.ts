import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import type { PlayableTeam } from './teams/teams.types';

const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
const map = new MapGenerator().generate(config, 7);
const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
const ROSTER: readonly RosterSlot[] = (['light', 'dark'] as const).map((team) => ({
  pilot: 'human',
  team,
  definitionId: 'warrior',
  role: 'rover',
}));

describe('Simulation: the Cathedral gem in a Duel', () => {
  it('lets the two Legends walk straight at each other through the centre', () => {
    const sim = new Simulation({
      config,
      seed: 7,
      logger: new NullLogger(),
      debug: TEST_DEBUG_CONFIG,
      map,
      mapObjects,
      roster: ROSTER,
      duel: { killTarget: 2 },
    });
    const xOf = (team: PlayableTeam): number =>
      sim.snapshot().entities.find((entity) => entity.id === sim.humanLegendIdOf(team))?.transform
        ?.x ?? Number.NaN;
    const light = sim.humanLegendIdOf('light') ?? '';
    const dark = sim.humanLegendIdOf('dark') ?? '';

    // Both walk along the start line, which runs through the gem, for 10 s.
    for (let tick = 0; tick < 300 && xOf('dark') - xOf('light') > 2; tick += 1) {
      sim.enqueueCommand({ type: 'move', actorId: light, direction: { x: 1, y: 0 } });
      sim.enqueueCommand({ type: 'move', actorId: dark, direction: { x: -1, y: 0 } });
      sim.step();
    }

    expect(xOf('dark') - xOf('light')).toBeLessThanOrEqual(2);
  });
});
