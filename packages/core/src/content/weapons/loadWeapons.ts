import { TickRate } from '../../utils/TickRate';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { KEBAB_CASE } from '../validation/KebabCaseIdRule.constants';
import { WEAPONS } from './weaponCatalogue';
import type { WeaponDefinition } from './weapons.types';

const isPositive = (value: number): boolean => value > 0 && Number.isFinite(value);

/** What is wrong with `weapon` as authored, or nothing. */
const problemsOf = (weapon: WeaponDefinition): string[] => {
  const problems: string[] = [];
  if (!KEBAB_CASE.test(weapon.id)) problems.push('id must be kebab-case');
  if (weapon.attacks.length === 0) problems.push('needs at least one attack');
  for (const field of ['damage', 'reach', 'interval'] as const) {
    if (weapon.attacks.some((attack) => !isPositive(attack[field]))) {
      problems.push(`attack ${field} must be positive`);
    }
  }
  if (
    weapon.uniqueTo !== null &&
    weapon.allowedClasses !== 'any' &&
    !weapon.allowedClasses.includes(weapon.uniqueTo)
  ) {
    problems.push('uniqueTo must be in allowedClasses');
  }
  return problems.map((problem) => `Weapon "${weapon.id}": ${problem}.`);
};

/**
 * Checks the weapons as authored, every rule at once (the shared half of `loadWeapons`, also run
 * by `loadDisplayContent`, which needs no tick rate).
 *
 * @throws ContentValidationError listing every broken rule.
 */
export const validateWeapons = (authored: readonly WeaponDefinition[]): void => {
  const problems = authored.flatMap(problemsOf);
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
};

/**
 * Loads the weapons: attack intervals from seconds to ticks (architecture 03 §11, as
 * `loadDefaultContent` does for units), validated once.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The weapons to load; the shipped set by default.
 * @throws ContentValidationError listing every broken rule.
 */
export const loadWeapons = (
  tickRate: number,
  authored: readonly WeaponDefinition[] = WEAPONS.all(),
): ContentCatalogue<WeaponDefinition> => {
  validateWeapons(authored);
  const rate = new TickRate(tickRate);
  return new ContentCatalogue(
    authored.map((weapon) => ({
      ...weapon,
      attacks: weapon.attacks.map((attack) => ({
        ...attack,
        interval: rate.toTicks(attack.interval),
      })),
    })),
  );
};
