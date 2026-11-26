import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { NullLogger } from '../../diagnostics/NullLogger';
import { Simulation } from '../../Simulation';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import { stepPastCountdown } from '../__fixtures__/stepPastCountdown';

describe('casting during the countdown (DEC-88: nothing casts until it ends)', () => {
  it('refuses a cast as cannot-cast, spends no aether and starts no cooldown', () => {
    const sim = new Simulation({
      config: createDefaultGameConfig(), // a 10 s countdown
      seed: 1,
      logger: new NullLogger(),
    });
    const log: string[] = [];
    sim.on('ability-cast', ({ abilityId }) => log.push(`cast ${abilityId}`));
    sim.on('command-rejected', ({ reason }) => log.push(`rejected ${reason}`));
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: { x: 50, y: 50 },
      count: 1,
    });
    sim.step();
    const castEast = () => {
      sim.enqueueCommand({
        type: 'cast-ability',
        actorId: 'entity-1',
        slot: 'ability-1',
        aim: { point: { x: 60, y: 50 }, targetId: null },
      });
      sim.step();
    };
    const aether = () => sim.snapshot().entities.find(({ id }) => id === 'entity-1')?.aether;

    castEast();
    expect(log).toEqual(['rejected cannot-cast']);
    expect(aether()).toEqual({ current: 100, max: 100 });

    stepPastCountdown(sim);
    castEast(); // a 12 s cooldown started by the refused cast would still run after 10 s

    expect(log).toEqual(['rejected cannot-cast', 'cast blade-runner']);
  });

  it('reports the player’s slots as blocked by cannot-cast until the countdown ends', () => {
    const sim = new Simulation({
      config: createDefaultGameConfig(),
      seed: 1,
      logger: new NullLogger(),
      map: TWO_LANE_MAP,
      roster: [{ pilot: 'human', team: 'light', definitionId: 'warrior', role: 'rover' }],
    });
    const bladeRunner = () => sim.snapshot().player?.slots.find(({ slot }) => slot === 'ability-1');

    sim.step();
    expect(bladeRunner()).toMatchObject({ isReady: false, blockedBy: 'cannot-cast' });

    stepPastCountdown(sim);
    sim.step();
    expect(bladeRunner()).toMatchObject({ isReady: true, blockedBy: null });
  });
});
