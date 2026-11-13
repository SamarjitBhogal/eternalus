import { createDefaultGameConfig, NullLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { CoreDuelSimulationFactory } from './CoreDuelSimulationFactory';

const SEED = 12345;
const MAX_TICKS = 6000;
const AFTER_RESET_TICKS = 10;
/** Past the one-second countdown, which rejects commands. */
const COUNTDOWN_TICKS = 120;
/** Ticks the light seat walks before it aims at the dark Legend. */
const WALK_TICKS = 100;
/** A kill takes about a thousand real ticks, slower than vitest's default under coverage. */
const TEST_TIMEOUT_MS = 30_000;

describe('CoreDuelSimulation', () => {
  it(
    'keeps moving a seat that holds its direction across a kill',
    () => {
      const duel = new CoreDuelSimulationFactory(
        createDefaultGameConfig({ match: { countdownSeconds: 1 } }),
        new NullLogger(),
        () => SEED,
      ).create();
      const transformOf = (team: 'light' | 'dark') =>
        duel.snapshot().entities.find((entity) => entity.id === duel.legendOf(team))?.transform ??
        null;
      const kills = () => {
        const score = duel.snapshot().match.duel?.kills;
        return (score?.light ?? 0) + (score?.dark ?? 0);
      };
      for (let tick = 0; tick < COUNTDOWN_TICKS; tick += 1) duel.step();
      const start = transformOf('light');

      for (let tick = 0; tick < MAX_TICKS && kills() === 0; tick += 1) {
        const isAttacking = tick >= WALK_TICKS;
        duel.enqueueIntent('light', {
          move: { x: 1, y: 0 },
          aim: isAttacking ? transformOf('dark') : null,
          isAttacking,
          triggered: [],
        });
        duel.step();
      }
      expect(kills()).toBe(1);

      for (let tick = 0; tick < AFTER_RESET_TICKS; tick += 1) {
        duel.enqueueIntent('light', { move: { x: 1, y: 0 }, aim: null, triggered: [] });
        duel.step();
      }
      expect(transformOf('light')?.x).toBeGreaterThan(start?.x ?? Infinity);
    },
    TEST_TIMEOUT_MS,
  );
});
