import { describe, expect, it } from 'vitest';

import { TEST_KIT, unitsWithWarriorKit } from './abilities/__fixtures__/casterState';
import { testAbilityRegistry } from './abilities/__fixtures__/fakeAbilities';
import { RecordingEffect } from './abilities/__fixtures__/RecordingEffect';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { NullLogger } from './diagnostics/NullLogger';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

const ROSTER: readonly RosterSlot[] = (['light', 'dark'] as const).flatMap((team) => [
  { pilot: 'bot', team, definitionId: 'warrior', role: 'laner', difficulty: 'normal' },
  { pilot: 'bot', team, definitionId: 'warrior', role: 'rover', difficulty: 'rover' },
]);

/** A bot-versus-bot match whose Warriors carry `TEST_KIT` (two castable slots, one unbuilt, one uncharged ultimate). */
const play = (ticks: number) => {
  const sim = new Simulation({
    config: createDefaultGameConfig(),
    seed: 11,
    logger: new NullLogger(),
    map: TWO_LANE_MAP,
    roster: ROSTER,
    content: unitsWithWarriorKit(TEST_KIT),
    abilities: testAbilityRegistry([new RecordingEffect('fake-strike')]),
  });
  const casts: string[] = [];
  sim.on('ability-cast', ({ casterId, abilityId }) => casts.push(`${casterId}:${abilityId}`));
  for (let tick = 0; tick < ticks; tick += 1) sim.step();
  return { hash: sim.hash(), casts };
};

describe('Simulation: bots cast any ready ability (DEC-205)', () => {
  it('casts from more than one slot, and a rerun gives the same casts and the same hash', () => {
    const first = play(3000);
    const second = play(3000);

    expect([...new Set(first.casts.map((cast) => cast.split(':')[1]))].sort()).toEqual([
      'fake-dash',
      'fake-strike',
    ]);
    expect(second).toEqual(first);
  });
});
