import { describe, expect, it } from 'vitest';

import type { Command } from '../../commands/Command.types';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { NullLogger } from '../../diagnostics/NullLogger';
import { runReplay } from '../../diagnostics/replay';
import { Simulation } from '../../Simulation';
import type { GameConfig } from '../../config/GameConfig.types';
import { ABILITY_CASTS_PLAN } from '../__fixtures__/abilityCastsPlan';
import { ABILITY_CASTS_SEED_11 } from '../__fixtures__/abilityCastsSeed11.replay';

const CONFIG = createDefaultGameConfig();

const createTarget = (setup: { readonly seed: number; readonly config: GameConfig }) =>
  new Simulation({ ...setup, logger: new NullLogger() });

/** Plays `plan` for `ticks` ticks on seed 11 and returns the hash and what the cast path said. */
const play = (plan: Readonly<Record<number, readonly Command[]>>, ticks = 450) => {
  const sim = createTarget({ seed: 11, config: CONFIG });
  const log: string[] = [];
  sim.on('ability-cast', ({ casterId, abilityId }) => log.push(`${casterId} ${abilityId}`));
  sim.on('command-rejected', ({ reason }) => log.push(`rejected ${reason}`));
  for (let tick = 0; tick < ticks; tick += 1) {
    for (const command of plan[tick] ?? []) sim.enqueueCommand(command);
    sim.step();
  }
  return { hash: sim.hash(), log };
};

describe('ability determinism (architecture 05 §16)', () => {
  it('gives the same hash for the same seed and casts, and casts change it', () => {
    const first = play(ABILITY_CASTS_PLAN);
    const second = play(ABILITY_CASTS_PLAN);
    const spawnOnly = play({ 0: ABILITY_CASTS_PLAN[0] ?? [] });

    expect(second).toEqual(first);
    expect(spawnOnly.hash).not.toBe(first.hash);
    expect(first.log).toEqual([
      'rejected cannot-cast', // during the countdown (DEC-88)
      'entity-1 slam',
      'entity-2 shockwave',
      'entity-3 blade-runner',
      'rejected on-cooldown',
      'entity-5 shockwave',
      'entity-7 shockwave',
    ]);
  });

  it('still reproduces the committed ability replay, checkpoint for checkpoint', () => {
    const outcome = runReplay(ABILITY_CASTS_SEED_11, createTarget);

    expect(outcome.firstDivergence).toBeNull();
    expect(outcome.finalHash).toBe(ABILITY_CASTS_SEED_11.checkpoints.at(-1)?.hash);
  });
});
