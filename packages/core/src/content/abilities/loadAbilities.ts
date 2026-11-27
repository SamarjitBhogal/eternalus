import { TickRate } from '../../utils/TickRate';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { isNonNegative, stepInTicks, ticksOf, timeProblems } from '../timesInTicks';
import { KEBAB_CASE } from '../validation/KebabCaseIdRule.constants';
import { ABILITIES } from './abilityCatalogue';
import type {
  AbilityDefinition,
  AbilityDefinitionWith,
  AuthoredAbilityWith,
  AuthoredStep,
  InTicks,
} from './AbilityDefinition.types';

/** Whether no step waits less after the cast than the step before it (05 §4; absent = 0). */
const hasDelaysInOrder = (steps: readonly { readonly delaySeconds?: number }[]): boolean =>
  steps.every(
    (step, index) =>
      index === 0 || (step.delaySeconds ?? 0) >= (steps[index - 1]?.delaySeconds ?? 0),
  );

/** What is wrong with `ability` as authored, or nothing. */
const problemsOf = (ability: AuthoredAbilityWith<AuthoredStep>): string[] => {
  const problems: string[] = [];
  if (!KEBAB_CASE.test(ability.id)) problems.push('id must be kebab-case');
  if (!KEBAB_CASE.test(ability.classId)) problems.push('classId must be kebab-case');
  if (!isNonNegative(ability.cooldownSeconds))
    problems.push('cooldownSeconds must not be negative');
  if (!isNonNegative(ability.aetherCost)) problems.push('aetherCost must not be negative');
  if (ability.slot === 'ultimate' && (ability.aetherCost !== 0 || ability.cooldownSeconds !== 0)) {
    problems.push('an ultimate costs no aether and has no cooldown (the meter gates it)');
  }
  if (ability.slot === 'passive' && (ability.aetherCost !== 0 || ability.cooldownSeconds !== 0)) {
    problems.push('a passive costs no aether and has no cooldown (it is never cast)');
  }
  if (ability.effects.length > 0 && ability.targeting === null) {
    problems.push('an ability with effects needs targeting');
  }
  if (ability.effects.length === 0 && ability.targeting !== null) {
    problems.push('an ability with no effects has no targeting yet');
  }
  problems.push(...timeProblems(ability.effects, 'effect'));
  if (!hasDelaysInOrder(ability.effects)) {
    problems.push('step delays must not decrease along the list (the steps fire in list order)');
  }
  return problems.map((problem) => `Ability "${ability.id}": ${problem}.`);
};

const load = <Step extends AuthoredStep>(
  ability: AuthoredAbilityWith<Step>,
  rate: TickRate,
): AbilityDefinitionWith<InTicks<Step>> => {
  const { cooldownSeconds, effects, ...rest } = ability;
  return {
    ...rest,
    cooldownTicks: ticksOf(cooldownSeconds, rate),
    effects: effects.map((step) => stepInTicks(step, rate)),
  };
};

/**
 * Loads the shipped abilities: every authored time from seconds to ticks (architecture 03 §8,
 * DEC-241, as `loadWeapons` does), validated once. The loader knows no effect or shape kind: it
 * checks the ability's own fields and that every time is 0 or more, and converts every
 * `<name>Seconds` field of a step to `<name>Ticks`; each step's other fields are checked by its
 * strategy when `createDefaultAbilityRegistry` resolves every ability at boot
 * (`AbilityEffect.validate`).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @throws ContentValidationError listing every broken rule.
 */
export function loadAbilities(tickRate: number): ContentCatalogue<AbilityDefinition>;
/**
 * Loads `authored` as the shipped abilities are loaded; a test may author an effect kind the
 * shipped union does not list (the Fake Bolt litmus, 05 §16).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The abilities to load.
 * @throws ContentValidationError listing every broken rule.
 */
export function loadAbilities<Ability extends AuthoredAbilityWith<AuthoredStep>>(
  tickRate: number,
  authored: readonly Ability[],
): ContentCatalogue<AbilityDefinitionWith<InTicks<Ability['effects'][number]>>>;
export function loadAbilities(
  tickRate: number,
  authored: readonly AuthoredAbilityWith<AuthoredStep>[] = ABILITIES.all(),
): ContentCatalogue<AbilityDefinitionWith<InTicks<AuthoredStep>>> {
  const problems = authored.flatMap(problemsOf);
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
  const rate = new TickRate(tickRate);
  return new ContentCatalogue(authored.map((ability) => load(ability, rate)));
}
