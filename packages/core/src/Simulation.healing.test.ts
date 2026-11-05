import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { OUT_OF_COMBAT_HEALING } from './content/healing/outOfCombatHealing';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

const TICK_RATE = 30;

const laners = (team: 'light' | 'dark', count: number): RosterSlot[] =>
  Array.from({ length: count }, () => ({
    team,
    definitionId: 'warrior',
    role: 'laner',
    difficulty: 'normal',
  }));

const match = () =>
  new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 10, legendsPerTeam: 6 } }),
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map: TWO_LANE_MAP,
    roster: [...laners('light', 4), ...laners('dark', 4)],
  });

describe('Simulation with out-of-combat healing (DEC-188)', () => {
  it('heals a bot that retreated hurt back to the rejoin line, and it fights again', () => {
    const simulation = match();
    const retreatedAt = new Map<string, number>();
    const rejoinedAt = new Map<string, number>();
    let fightsAfterRejoin = 0;
    simulation.on('damage-applied', ({ source }) => {
      if (source.attackerId !== null && rejoinedAt.has(source.attackerId)) {
        fightsAfterRejoin += 1;
      }
    });

    for (let tick = 0; tick < 150 * TICK_RATE; tick += 1) {
      simulation.step();
      for (const { id, kind, health } of simulation.snapshot().entities) {
        if (kind !== 'warrior' || health === null) continue;
        const fraction = health.current / health.max;
        if (fraction < 0.3 && !retreatedAt.has(id)) retreatedAt.set(id, tick);
        if (retreatedAt.has(id) && !rejoinedAt.has(id) && fraction >= 0.8) rejoinedAt.set(id, tick);
      }
    }

    expect(retreatedAt.size).toBeGreaterThan(0);
    expect(rejoinedAt.size).toBeGreaterThan(0);
    for (const [id, tick] of rejoinedAt) {
      // Nobody heals before the out-of-combat delay.
      expect(tick - (retreatedAt.get(id) ?? 0)).toBeGreaterThanOrEqual(
        OUT_OF_COMBAT_HEALING.delaySeconds * TICK_RATE,
      );
    }
    expect(fightsAfterRejoin).toBeGreaterThan(0);
  });

  it('plays out the same way twice: same seed, same hash', () => {
    const hashes = [1, 2].map(() => {
      const simulation = match();
      for (let tick = 0; tick < 100 * TICK_RATE; tick += 1) {
        simulation.step();
      }
      return simulation.hash();
    });

    expect(hashes[0]).toBe(hashes[1]);
  });
});
