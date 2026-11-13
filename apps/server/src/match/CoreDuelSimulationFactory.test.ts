import { createDefaultGameConfig, DUEL_RULES, NullLogger } from '@eternalus/core';
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

  it('plays the Duel rules: first to the kill target, both Legends in the Cathedral', () => {
    const factory = new CoreDuelSimulationFactory(
      createDefaultGameConfig(),
      new NullLogger(),
      () => SEED,
    );
    const snapshot = factory.create().snapshot();
    const [light, dark] = ['light', 'dark'].map((team) =>
      snapshot.entities.find((entity) => entity.family === 'legend' && entity.team === team),
    );

    expect(snapshot.match.duel).toEqual({
      kills: { light: 0, dark: 0 },
      killTarget: DUEL_RULES.killTarget,
    });
    expect(light?.transform?.x).toBeLessThan(dark?.transform?.x ?? 0);
    expect(light?.transform?.y).toBe(dark?.transform?.y);
  });
});
