import { TickRate } from '../../utils/TickRate';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { KEBAB_CASE } from '../validation/KebabCaseIdRule.constants';
import { ABILITIES } from './abilityCatalogue';
import type {
  AbilityDefinition,
  AbilityDefinitionWith,
  AuthoredAbilityWith,
  AuthoredStep,
  InTicks,
} from './AbilityDefinition.types';

/** The suffix of an authored time field (`durationSeconds`) and of its loaded one (`durationTicks`). */
const SECONDS = 'Seconds';
const TICKS = 'Ticks';

const isNonNegative = (value: number): boolean => value >= 0 && Number.isFinite(value);

/** Whether `value` is an object with a string `kind`: an effect step, or a shape inside one. */
const isKinded = (value: object): value is AuthoredStep =>
  'kind' in value && typeof value.kind === 'string';

/**
 * Every `<name>Seconds` field in `value` (at any depth) that is not a finite time of 0 or more,
 * named after the nearest step kind around it. The one rule the loader checks inside a step: its
 * other fields are its strategy's to check (`AbilityEffect.validate`).
 */
const timeProblems = (value: unknown, kind: string): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown) => timeProblems(item, kind));
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  const owner = isKinded(value) ? value.kind : kind;
  return Object.entries(value).flatMap(([key, field]: [string, unknown]) =>
    key.endsWith(SECONDS) && field !== undefined
      ? typeof field === 'number' && isNonNegative(field)
        ? []
        : [`${owner} ${key} must not be negative`]
      : timeProblems(field, owner),
  );
};

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
  if (ability.effects.length > 0 && ability.targeting === null) {
    problems.push('an ability with effects needs targeting');
  }
  if (ability.effects.length === 0 && ability.targeting !== null) {
    problems.push('an ability with no effects has no targeting yet');
  }
  problems.push(...timeProblems(ability.effects, 'effect'));
  return problems.map((problem) => `Ability "${ability.id}": ${problem}.`);
};

/** `seconds` in ticks; 0 stays 0 (an ultimate's cooldown, a step with no delay). */
const ticksOf = (seconds: number, rate: TickRate): number =>
  seconds === 0 ? 0 : rate.toTicks(seconds);

/** `value` with every `<name>Seconds` field, at any depth, renamed `<name>Ticks` and converted. */
const inTicks = (value: unknown, rate: TickRate): unknown => {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => inTicks(item, rate));
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, field]: [string, unknown]) =>
      key.endsWith(SECONDS)
        ? [
            `${key.slice(0, -SECONDS.length)}${TICKS}`,
            typeof field === 'number' ? ticksOf(field, rate) : field,
          ]
        : [key, inTicks(field, rate)],
    ),
  );
};

/** One effect step with its times in ticks, whatever its kind. */
const stepInTicks = <Step extends AuthoredStep>(step: Step, rate: TickRate): InTicks<Step> =>
  // `inTicks` renames exactly the fields `InTicks` renames; TypeScript cannot follow a key rename.
  inTicks(step, rate) as InTicks<Step>;

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
 * Loads the shipped abilities: every authored time from seconds to ticks (architecture 03 §11, as
 * `loadWeapons` does), validated once. The loader knows no effect or shape kind: it checks the
 * ability's own fields and that every time is 0 or more, and converts every `<name>Seconds` field
 * of a step to `<name>Ticks`; each step's other fields are checked by its strategy when
 * `createDefaultAbilityRegistry` resolves every ability at boot (`AbilityEffect.validate`).
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
