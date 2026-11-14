import { TickRate } from '../../utils/TickRate';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { STATUS_EFFECTS } from '../status-effects/statusEffectCatalogue';
import { KEBAB_CASE } from '../validation/KebabCaseIdRule.constants';
import { ABILITIES } from './abilityCatalogue';
import type {
  AbilityDefinition,
  AbilityEffectSpec,
  AuthoredAbility,
  AuthoredEffectSpec,
  AuthoredShapedEffectSpec,
  EffectShape,
  ShapedEffectSpec,
} from './AbilityDefinition.types';

const isPositive = (value: number): boolean => value > 0 && Number.isFinite(value);

const isNonNegative = (value: number): boolean => value >= 0 && Number.isFinite(value);

/** What is wrong with one effect step (and its children), or nothing. */
const effectProblems = (
  effect: AuthoredEffectSpec,
  statusIds: Pick<ContentCatalogue<{ readonly id: string }>, 'has'>,
): string[] => {
  switch (effect.kind) {
    case 'damage':
      return [
        ...(isPositive(effect.amount) ? [] : ['damage amount must be positive']),
        ...(effect.structureMultiplier === undefined || isNonNegative(effect.structureMultiplier)
          ? []
          : ['structureMultiplier must not be negative']),
        ...shapeProblems(effect.shape),
      ];
    case 'knockback':
      return [
        ...(isPositive(effect.distance) ? [] : ['knockback distance must be positive']),
        ...shapeProblems(effect.shape),
      ];
    case 'debuff':
      return [
        ...(statusIds.has(effect.statusId)
          ? []
          : [`debuff status "${effect.statusId}" is unknown`]),
        ...(effect.durationSeconds === undefined || isPositive(effect.durationSeconds)
          ? []
          : ['debuff durationSeconds must be positive']),
        ...shapeProblems(effect.shape),
      ];
    case 'dash':
      return [
        ...(isPositive(effect.distance) ? [] : ['dash distance must be positive']),
        ...(isPositive(effect.durationSeconds) ? [] : ['dash durationSeconds must be positive']),
        ...[...effect.onPath, ...effect.onEnd].flatMap((step) => effectProblems(step, statusIds)),
      ];
  }
};

const shapeProblems = (shape: EffectShape): string[] => {
  if (shape.kind === 'circle') {
    return isPositive(shape.radius) ? [] : ['circle radius must be positive'];
  }
  return isPositive(shape.width) ? [] : ['path width must be positive'];
};

/** What is wrong with `ability` as authored, or nothing. */
const problemsOf = (
  ability: AuthoredAbility,
  statusIds: Pick<ContentCatalogue<{ readonly id: string }>, 'has'>,
): string[] => {
  const problems: string[] = [];
  if (!KEBAB_CASE.test(ability.id)) problems.push('id must be kebab-case');
  if (!KEBAB_CASE.test(ability.classId)) problems.push('classId must be kebab-case');
  if (!isNonNegative(ability.cooldownSeconds))
    problems.push('cooldownSeconds must not be negative');
  if (!isNonNegative(ability.aetherCost)) problems.push('aetherCost must not be negative');
  if (ability.slot === 'ultimate' && (ability.aetherCost !== 0 || ability.cooldownSeconds !== 0)) {
    problems.push('an ultimate costs no aether and has no cooldown (the meter gates it)');
  }
  if (ability.effects.length > 0 && ability.targeting === null) {
    problems.push('an ability with effects needs targeting');
  }
  if (ability.effects.length === 0 && ability.targeting !== null) {
    problems.push('an ability with no effects has no targeting yet');
  }
  problems.push(...ability.effects.flatMap((effect) => effectProblems(effect, statusIds)));
  return problems.map((problem) => `Ability "${ability.id}": ${problem}.`);
};

const loadShaped = (effect: AuthoredShapedEffectSpec, rate: TickRate): ShapedEffectSpec => {
  if (effect.kind !== 'debuff') {
    return effect;
  }
  const { durationSeconds, ...rest } = effect;
  return {
    ...rest,
    ...(durationSeconds !== undefined && { durationTicks: rate.toTicks(durationSeconds) }),
  };
};

const loadEffect = (effect: AuthoredEffectSpec, rate: TickRate): AbilityEffectSpec => {
  if (effect.kind !== 'dash') {
    return loadShaped(effect, rate);
  }
  const { durationSeconds, onPath, onEnd, ...rest } = effect;
  return {
    ...rest,
    durationTicks: rate.toTicks(durationSeconds),
    onPath: onPath.map((step) => loadShaped(step, rate)),
    onEnd: onEnd.map((step) => loadShaped(step, rate)),
  };
};

const load = (ability: AuthoredAbility, rate: TickRate): AbilityDefinition => {
  const { cooldownSeconds, effects, ...rest } = ability;
  return {
    ...rest,
    cooldownTicks: cooldownSeconds === 0 ? 0 : rate.toTicks(cooldownSeconds),
    effects: effects.map((effect) => loadEffect(effect, rate)),
  };
};

/**
 * Loads the abilities: cooldowns, dash times and debuff durations from seconds to ticks
 * (architecture 03 §11, as `loadWeapons` does), validated once.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The abilities to load; the shipped set by default.
 * @param statuses - The statuses a debuff may name; the shipped set by default.
 * @throws ContentValidationError listing every broken rule.
 */
export const loadAbilities = (
  tickRate: number,
  authored: readonly AuthoredAbility[] = ABILITIES.all(),
  statuses: Pick<ContentCatalogue<{ readonly id: string }>, 'has'> = STATUS_EFFECTS,
): ContentCatalogue<AbilityDefinition> => {
  const problems = authored.flatMap((ability) => problemsOf(ability, statuses));
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
  const rate = new TickRate(tickRate);
  return new ContentCatalogue(authored.map((ability) => load(ability, rate)));
};
