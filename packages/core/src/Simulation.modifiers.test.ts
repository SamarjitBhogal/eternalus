import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { LIGHT_MINION } from './content/mobs/lightMinion';
import { MINION_STRENGTH } from './content/mobs/minionModifiers';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { Simulation } from './Simulation';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

/**
 * A match whose light opening hordes form up at their own end of the lanes, with a dark Warrior
 * waiting there for them, so every light minion hit lands close to home.
 */
const ambush = () => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 600 } }),
    seed: 1,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map: TWO_LANE_MAP,
  });
  simulation.enqueueCommand({
    type: 'dev-spawn',
    kind: 'warrior',
    definitionId: 'warrior',
    team: 'dark',
    at: { x: 18, y: 24 },
    count: 1,
  });
  const minionHits: number[] = [];
  simulation.on('damage-applied', ({ targetId, amount, absorbed, source }) => {
    // The killing blow is cut to the target's last health, so it says nothing about strength.
    const isKillingBlow = () =>
      simulation.snapshot().entities.find(({ id }) => id === targetId)?.health?.current === 0;
    if (source.definitionId === LIGHT_MINION.id && !isKillingBlow()) {
      minionHits.push(amount + absorbed);
    }
  });
  return { simulation, logger, minionHits };
};

describe('Simulation with the minion modifiers (minion plan M5a)', () => {
  it('lets minions near home hit harder than base, through the damage pipeline', () => {
    const { simulation, logger, minionHits } = ambush();

    for (let tick = 0; tick < 300; tick += 1) {
      simulation.step();
    }

    expect(minionHits.length).toBeGreaterThan(0);
    const base = LIGHT_MINION.attack.damage;
    expect(minionHits.every((hit) => hit > base && hit <= base * MINION_STRENGTH.max)).toBe(true);
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('gives the same hash for the same seed with the modifiers live', () => {
    const hashes = [1, 2].map(() => {
      const { simulation } = ambush();
      for (let tick = 0; tick < 300; tick += 1) {
        simulation.step();
      }
      return simulation.hash();
    });

    expect(hashes[0]).toBe(hashes[1]);
  });
});
