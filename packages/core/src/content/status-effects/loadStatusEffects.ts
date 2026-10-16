import { ContentCatalogue } from '../ContentCatalogue';
import { STATUS_EFFECTS } from './statusEffectCatalogue';
import type { StatusEffectDefinition } from './statusEffects.types';

const toTicks = (seconds: number, tickRate: number): number =>
  Math.max(1, Math.round(seconds * tickRate));

const perTick = (status: StatusEffectDefinition, tickRate: number): StatusEffectDefinition => ({
  ...status,
  duration: status.duration === null ? null : toTicks(status.duration, tickRate),
  periodic: status.periodic && {
    ...status.periodic,
    every: toTicks(status.periodic.every, tickRate),
  },
});

/**
 * Loads every shipped status effect with its times converted from seconds to ticks, so the
 * simulation only ever sees ticks (architecture 03 §11), the way `loadDefaultContent` does for units.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 */
export const loadStatusEffects = (tickRate: number): ContentCatalogue<StatusEffectDefinition> =>
  new ContentCatalogue(STATUS_EFFECTS.all().map((status) => perTick(status, tickRate)));
