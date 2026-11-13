import { createDefaultGameConfig, NullLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { CoreDuelSimulationFactory } from './CoreDuelSimulationFactory';

const SEED = 12345;
const INTENT = { move: { x: 1, y: 0 }, aim: null, triggered: [] };

describe('CoreDuelSimulationFactory', () => {
  it('builds a Duel with one distinct Legend per seat that advances', () => {
    const factory = new CoreDuelSimulationFactory(
      createDefaultGameConfig(),
      new NullLogger(),
      () => SEED,
    );
    const duel = factory.create();
    expect(duel.legendOf('light')).not.toBe(duel.legendOf('dark'));
    duel.enqueueIntent('light', INTENT);
    duel.step();
    expect(duel.snapshot().tick).toBe(1);
    expect(duel.isOver()).toBe(false);
    expect(duel.winner()).toBeNull();
  });
});
