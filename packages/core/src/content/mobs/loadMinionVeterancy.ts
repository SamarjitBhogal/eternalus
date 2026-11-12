import { TickRate } from '../../utils/TickRate';
import { MINION_VETERANCY } from './minionVeterancy';
import type { AuthoredMinionVeterancy, MinionVeterancyDefinition } from './mobs.types';

/**
 * Loads the minion veterancy rules: the aura's period from seconds to ticks, once, never below
 * one tick (architecture 03 §11, as `loadStatusEffects` does for statuses).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The rules to load; the shipped ones by default.
 */
export const loadMinionVeterancy = (
  tickRate: number,
  authored: AuthoredMinionVeterancy = MINION_VETERANCY,
): MinionVeterancyDefinition => {
  const { everySeconds, ...aura } = authored.aura;
  return {
    ...authored,
    aura: { ...aura, everyTicks: new TickRate(tickRate).toTicks(everySeconds) },
  };
};
