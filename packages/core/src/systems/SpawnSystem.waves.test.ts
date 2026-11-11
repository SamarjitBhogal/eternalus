import { describe, expect, it } from 'vitest';
import { StateHasher } from '../state/StateHasher';
import {
  NO_OPENING,
  setUp,
  summary,
  COUNTDOWN,
  HEAVY,
  TICK_RATE,
} from './__fixtures__/spawnSystemSetup';

describe('SpawnSystem', () => {
  it('starts every wave clock at the countdown end: first waves at 180, 200 and 230 s, then each interval', () => {
    const { timeline, runTo } = setUp({}, { openingWave: NO_OPENING });

    runTo(HEAVY - 1);
    expect(timeline).toEqual([]);

    const at = (seconds: number) => String(COUNTDOWN + seconds * TICK_RATE);
    runTo(COUNTDOWN + 320 * TICK_RATE);
    // Heavies every 90 s from 180 s, lights every 60 s from 200 s, mediums every 60 s from 230 s.
    // Spawner id order within a tick: buff, spawner, then Stronghold, Dark before Light. The
    // heavy horde takes the worst lane: every lane ties at the start, so the middle (lane-1).
    expect(timeline).toEqual([
      `${at(180)} dark lane-1 4`,
      `${at(180)} light lane-1 4`,
      `${at(200)} dark lane-0 16`,
      `${at(200)} light lane-0 16`,
      `${at(230)} dark lane-1 8`,
      `${at(230)} light lane-1 8`,
      `${at(260)} dark lane-0 16`,
      `${at(260)} light lane-0 16`,
      `${at(270)} dark lane-1 4`,
      `${at(270)} light lane-1 4`,
      `${at(290)} dark lane-1 8`,
      `${at(290)} light lane-1 8`,
      `${at(320)} dark lane-0 16`,
      `${at(320)} light lane-0 16`,
    ]);
  });

  it('waits for the countdown: a longer countdown moves every first wave by the same time', () => {
    const { timeline, runTo } = setUp(
      { match: { countdownSeconds: 600 } },
      { openingWave: NO_OPENING },
    );
    const firstHeavy = (600 + 180) * TICK_RATE;

    runTo(firstHeavy - 1);
    expect(timeline).toEqual([]);

    runTo(firstHeavy);
    expect(timeline).toEqual([
      `${String(firstHeavy)} dark lane-1 4`,
      `${String(firstHeavy)} light lane-1 4`,
    ]);
  });

  it('sends a wave due at tick 0 along with the opening hordes', () => {
    const atOnce = {
      'spawner-tower': [
        {
          mobId: 'light-minion',
          weightClass: 'light',
          firstAtSeconds: 0,
          everySeconds: 60,
          lane: 'own-lane',
        },
      ],
    } as const;
    const { spawned, runTo } = setUp({ match: { countdownSeconds: 0 } }, { waves: atOnce });

    runTo(0);

    // Four opening hordes (two lanes, two teams), then each team's SpawnerTower wave on lane-0.
    expect(summary(spawned)).toHaveLength(6);
    expect(summary(spawned).slice(4)).toEqual(['dark lane-0 16', 'light lane-0 16']);
  });

  it('spawns the same hordes the same way twice: the same state hash at the first heavy wave', () => {
    const hashes = [1, 2].map(() => {
      const { state, runTo } = setUp();
      runTo(HEAVY);
      return new StateHasher().hash(state);
    });

    expect(hashes[0]).toBe(hashes[1]);
  });
});
