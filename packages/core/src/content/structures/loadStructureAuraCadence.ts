import { TickRate } from '../../utils/TickRate';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import { STRUCTURE_AURA_CADENCE } from './structureAuraCadence';
import type { AuthoredStructureAuraCadence, StructureAuraCadence } from './structures.types';

/**
 * Loads the structure aura cadence: seconds to ticks, once, never below one tick (architecture 03
 * §8, as `loadMinionVeterancy` does).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The cadence to load; the shipped one by default.
 * @throws ContentValidationError when the period is negative or not finite.
 */
export const loadStructureAuraCadence = (
  tickRate: number,
  authored: AuthoredStructureAuraCadence = STRUCTURE_AURA_CADENCE,
): StructureAuraCadence => {
  assertNonNegativeFinite('structure aura', [['everySeconds', authored.everySeconds]]);
  return { everyTicks: new TickRate(tickRate).toTicks(authored.everySeconds) };
};
