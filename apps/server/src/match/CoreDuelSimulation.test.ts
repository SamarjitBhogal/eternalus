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
/** Gap, in world units, at which the light seat stops walking and fights from where it stands. */
const CLOSE_ENOUGH = 2;
/** How far either side of the gem the light seat steps south to go round it (DEC-346). */
const ROUND_THE_GEM = 15;
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
      // The Duel starts either side of the Cathedral gem, which blocks movement (DEC-346).
      const gemX = ((start?.x ?? 0) + (transformOf('dark')?.x ?? 0)) / 2;

      for (let tick = 0; tick < MAX_TICKS && kills() === 0; tick += 1) {
        const isAttacking = tick >= WALK_TICKS;
        const dark = transformOf('dark');
        // Walks to the dark Legend, stepping south round the gem, and stops beside it, so the hits
        // keep landing.
        const light = transformOf('light');
        const isClosing = (dark?.x ?? 0) - (light?.x ?? 0) > CLOSE_ENOUGH;
        const isByTheGem = Math.abs((light?.x ?? 0) - gemX) < ROUND_THE_GEM;
        duel.enqueueIntent('light', {
          move: {
            x: isClosing ? 1 : 0,
            y: isByTheGem ? 1 : Math.sign((dark?.y ?? 0) - (light?.y ?? 0)),
          },
          aim: isAttacking ? dark : null,
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
