import { TickRate } from '../../utils/TickRate';
import { ContentValidationError } from '../ContentValidationError';
import { SPAWN_WAVES } from './spawnWaves';
import type { AuthoredSpawnWave, SpawnWaveDefinition } from './structures.types';

/**
 * Loads the horde waves: the first wave's time and the interval from seconds to ticks, once
 * (architecture 03 §8, as `loadStatusEffects` does for statuses), rounded with no one-tick floor
 * so a first wave at 0 s goes out when the countdown ends.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - Each spawning structure kind's waves; the shipped set by default.
 * @throws ContentValidationError when a wave starts before the countdown ends or repeats more
 *   often than once a tick, naming every such wave. Every authored wave is checked, also one of a
 *   structure kind that a map does not build (DEC-241).
 */
export const loadSpawnWaves = (
  tickRate: number,
  authored: Readonly<Record<string, readonly AuthoredSpawnWave[]>> = SPAWN_WAVES,
): Readonly<Record<string, readonly SpawnWaveDefinition[]>> => {
  const rate = new TickRate(tickRate);
  const problems: string[] = [];
  const loaded = Object.entries(authored).map(
    ([kind, waves]) =>
      [
        kind,
        waves.map(({ firstAtSeconds, everySeconds, ...rest }) => {
          const everyTicks = rate.roundToTicks(everySeconds);
          // Not `assertNonNegativeFinite`: an interval must also be at least one tick.
          if (!(Number.isFinite(everyTicks) && everyTicks >= 1)) {
            problems.push(`${kind} wave repeats every ${String(everySeconds)} s`);
          }
          if (!(Number.isFinite(firstAtSeconds) && firstAtSeconds >= 0)) {
            problems.push(`${kind} wave starts ${String(firstAtSeconds)} s after the countdown`);
          }
          return { ...rest, firstAtTicks: rate.roundToTicks(firstAtSeconds), everyTicks };
        }),
      ] as const,
  );
  if (problems.length > 0) {
    throw new ContentValidationError(`Invalid spawn waves: ${problems.join('; ')}`);
  }
  return Object.fromEntries(loaded);
};
