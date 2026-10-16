import { TickRate } from '../../utils/TickRate';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { STATUS_EFFECTS } from './statusEffectCatalogue';
import type { AuthoredStatusEffect, StatusEffectDefinition } from './statusEffects.types';

const KEBAB_ID = /^[a-z]+(-[a-z]+)*$/;

const isPositive = (value: number): boolean => value > 0 && Number.isFinite(value);

/** What is wrong with `status` before (times) and after (caps) loading, or nothing. */
const problemsOf = (authored: AuthoredStatusEffect, status: StatusEffectDefinition): string[] => {
  const problems: string[] = [];
  if (authored.durationSeconds !== null && !isPositive(authored.durationSeconds)) {
    problems.push('durationSeconds must be positive');
  }
  if (authored.periodic !== null && !isPositive(authored.periodic.everySeconds)) {
    problems.push('everySeconds must be positive');
  }
  if (
    status.periodic?.effects.some(
      (spec) => !isPositive('amount' in spec ? spec.amount : spec.fractionOfMax),
    ) === true
  ) {
    problems.push('periodic amounts must be positive');
  }
  if (!KEBAB_ID.test(status.id)) problems.push('id must be kebab-case');
  if (!Number.isInteger(status.maxStacks) || status.maxStacks < 1)
    problems.push('maxStacks must be a whole number of at least 1');
  if (status.stacking === 'refresh' && status.maxStacks !== 1)
    problems.push('refresh needs maxStacks 1');
  if (status.modifiers.some(({ value }) => !isPositive(value))) {
    problems.push('modifier values must be positive');
  }
  if (status.periodic?.effects.length === 0) problems.push('periodic needs at least one effect');
  return problems.map((problem) => `Status "${status.id}": ${problem}.`);
};

const load = (
  status: AuthoredStatusEffect,
  rate: TickRate,
  structuresPerLane: number,
): StatusEffectDefinition => {
  const { durationSeconds, maxStacks, periodic, ...rest } = status;
  return {
    ...rest,
    durationTicks: durationSeconds === null ? null : rate.toTicks(durationSeconds),
    maxStacks: maxStacks === 'structures-per-lane' ? structuresPerLane : maxStacks,
    periodic: periodic && {
      everyTicks: rate.toTicks(periodic.everySeconds),
      effects: periodic.effects,
    },
  };
};

/**
 * Loads the status effects: times from seconds to ticks (architecture 03 §11, as
 * `loadDefaultContent` does for units), config-derived caps resolved, then validated once.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param structuresPerLane - `map.spawnTowersPerLane + map.buffTowersPerLane`.
 * @param authored - The statuses to load; the shipped set by default.
 * @throws ContentValidationError listing every broken rule.
 */
export const loadStatusEffects = (
  tickRate: number,
  structuresPerLane: number,
  authored: readonly AuthoredStatusEffect[] = STATUS_EFFECTS.all(),
): ContentCatalogue<StatusEffectDefinition> => {
  const rate = new TickRate(tickRate);
  const pairs = authored.map((status) => [status, load(status, rate, structuresPerLane)] as const);
  const problems = pairs.flatMap(([status, loaded]) => problemsOf(status, loaded));
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
  return new ContentCatalogue(pairs.map(([, loaded]) => loaded));
};
