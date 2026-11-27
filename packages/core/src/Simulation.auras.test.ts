import { describe, expect, it } from 'vitest';

import { countdownTicks } from './config/countdownTicks';
import { loadStructureAuraCadence } from './content/structures/loadStructureAuraCadence';
import { match, run } from './__fixtures__/hordeMatches';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

describe('Simulation structure auras (DEC-315 (4))', () => {
  it('gives units near a living buff tower its statuses in a whole match, and takes them away when it is gone', () => {
    // Nothing fights, so the two units stand where they are put.
    const { simulation, config } = match(TWO_LANE_MAP, 1, true);
    run(simulation, countdownTicks(config.match.countdownSeconds, config.tickRate) + 1);
    const tower = simulation
      .snapshot()
      .entities.find(({ mapFeatureId }) => mapFeatureId === 'buff-light-1');
    const { x, y } = tower?.transform ?? { x: 0, y: 0 };
    const held = new Map<string, Set<string>>();
    simulation.on('status-applied', ({ entityId, statusId }) => {
      held.set(entityId, (held.get(entityId) ?? new Set()).add(statusId));
    });
    simulation.on('status-expired', ({ entityId, statusId }) => {
      held.get(entityId)?.delete(statusId);
    });
    // A lane minion exists only in its horde, so the units are training dummies (no attack).
    for (const [team, dx] of [
      ['light', 10],
      ['dark', -10],
    ] as const) {
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'light-mob',
        definitionId: 'training-dummy',
        team,
        at: { x: x + dx, y },
        count: 1,
      });
    }
    run(simulation, config.tickRate);
    const dummyOf = (team: string) =>
      simulation
        .snapshot()
        .entities.find((entity) => entity.definitionId === 'training-dummy' && entity.team === team)
        ?.id ?? '';
    const ally = dummyOf('light');
    const enemy = dummyOf('dark');

    expect([...(held.get(ally) ?? [])]).toEqual(['tower-aura-buff']);
    expect([...(held.get(enemy) ?? [])]).toEqual(['tower-aura-debuff']);

    simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: tower?.id ?? '' });
    run(simulation, loadStructureAuraCadence(config.tickRate).everyTicks + 1);

    expect([...(held.get(ally) ?? [])]).toEqual([]);
    expect([...(held.get(enemy) ?? [])]).toEqual([]);
  });
});
