import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { BOT_ROSTER } from './botRoster';

const config = createDefaultGameConfig();

/**
 * The minion stack's lane rule (PR #46, `state/assignLanes.ts`), restated: in roster order each
 * laner takes the lane with the fewest Legends so far, the lowest index first.
 */
function lanesInRosterOrder(laners: number, numLanes: number): number[] {
  const counts = Array.from({ length: numLanes }, () => 0);
  return Array.from({ length: laners }, () => {
    const lane = counts.indexOf(Math.min(...counts));
    counts[lane] = (counts[lane] ?? 0) + 1;
    return lane;
  });
}

describe('BOT_ROSTER', () => {
  it('fills each team but its Rover, within the lanes (config legendsPerTeam, numLanes)', () => {
    const { legendsPerTeam, legendsPerLane } = config.match;

    expect(BOT_ROSTER.laners).toHaveLength(legendsPerTeam - 1);
    expect(BOT_ROSTER.laners.length).toBeLessThanOrEqual(config.map.numLanes * legendsPerLane);
  });

  it('fields three of each class (DEC-61)', () => {
    const count = (classId: string) => BOT_ROSTER.laners.filter((id) => id === classId).length;

    expect([count('warrior'), count('sentinel'), count('magus')]).toEqual([3, 3, 3]);
  });

  it('puts one Vanguard, one Sentinel and one Magus in each lane under PR #46 (DEC-102)', () => {
    const { numLanes } = config.map;
    const lanes = lanesInRosterOrder(BOT_ROSTER.laners.length, numLanes);
    const classesIn = (lane: number) =>
      BOT_ROSTER.laners.filter((_, index) => lanes[index] === lane).sort();

    for (let lane = 0; lane < numLanes; lane += 1) {
      expect(classesIn(lane)).toEqual(['magus', 'sentinel', 'warrior']);
    }
  });

  it('mirrors the player with the enemy Rover (DEC-61)', () => {
    expect(BOT_ROSTER.enemyRover).toBe('mirror-player');
  });
});
