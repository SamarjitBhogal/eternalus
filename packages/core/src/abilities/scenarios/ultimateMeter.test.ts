import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import type { GameEventMap } from '../../state/GameEvents.types';
import { abilityMatch } from '../__fixtures__/abilityMatch';

/**
 * The ultimate meter in a real match (architecture 05 §6, DEC-272, DEC-273): the Magus at
 * (50, 50) casts Shockwave (120 damage in 5 m) on three enemy training dummies (light mobs, 100
 * health) and a dark spawner tower. Each kill gives a light mob's point and the tower hit one
 * point for each 2% of its health; nothing else ever fills it. Every invariant runs each tick and
 * throws, `ultimate-never-fills-passively` with them.
 */
const SELF = { x: 50, y: 50 };

const match = () => {
  const scenario = abilityMatch(
    [
      { kind: 'magus', team: 'light', at: SELF },
      { kind: 'light-mob', definitionId: 'training-dummy', team: 'dark', at: { x: 53, y: 50 } },
      { kind: 'light-mob', definitionId: 'training-dummy', team: 'dark', at: { x: 47, y: 50 } },
      { kind: 'light-mob', definitionId: 'training-dummy', team: 'dark', at: { x: 50, y: 53 } },
      { kind: 'spawner-tower', team: 'dark', at: { x: 50, y: 44 } },
    ],
    { debug: TEST_DEBUG_CONFIG },
  );
  const charged: GameEventMap['ultimate-charged'][] = [];
  scenario.sim.on('ultimate-charged', (change) => charged.push(change));
  return { ...scenario, charged };
};

describe('ultimate meter (scenario)', () => {
  it('fills from kills and structure damage through the pipeline, never on its own', () => {
    const { ids, cast, run, charged, entity } = match();
    const [magus, , , , tower] = ids;
    const towerMax = entity(tower)?.health?.max ?? Number.NaN;

    cast(magus ?? '', 'ability-1', SELF);
    run(2);

    expect(charged.map(({ entityId, cause }) => `${entityId} ${cause}`)).toEqual([
      `${magus ?? ''} mob-kill`,
      `${magus ?? ''} mob-kill`,
      `${magus ?? ''} mob-kill`,
      `${magus ?? ''} structure-damage`,
    ]);
    expect(charged.at(-1)?.charge).toBeCloseTo((0.5 * ((100 * 120) / towerMax) + 3) / 100);

    run(1000);
    expect(charged).toHaveLength(4);
  });

  it('gives the same hash for the same seed', () => {
    const [first, second] = [match(), match()];
    for (const scenario of [first, second]) {
      scenario.cast(scenario.ids[0] ?? '', 'ability-1', SELF);
      scenario.run(30);
    }

    expect(first.charged).toHaveLength(4);
    expect(second.sim.hash()).toBe(first.sim.hash());
  });
});
