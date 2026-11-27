import { TickRate } from '../../utils/TickRate';
import { attackInTicks, timeProblems } from '../timesInTicks';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { KEBAB_CASE } from '../validation/KebabCaseIdRule.constants';
import { KnownProjectileRule } from '../validation/KnownProjectileRule';
import { PROJECTILES } from '../projectiles/projectileCatalogue';
import { WEAPONS } from './weaponCatalogue';
import type { ProjectileDefinition } from '../projectiles/projectiles.types';
import type { AuthoredWeaponDefinition, WeaponDefinition } from './weapons.types';

const isPositive = (value: number): boolean => value > 0 && Number.isFinite(value);

/** What is wrong with `weapon` as authored, or nothing. */
const problemsOf = (
  weapon: AuthoredWeaponDefinition,
  projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'has'>,
): string[] => {
  const problems: string[] = [];
  if (!KEBAB_CASE.test(weapon.id)) problems.push('id must be kebab-case');
  if (weapon.attacks.length === 0) problems.push('needs at least one attack');
  for (const field of ['damage', 'reach', 'interval'] as const) {
    if (weapon.attacks.some((attack) => !isPositive(attack[field]))) {
      problems.push(`attack ${field} must be positive`);
    }
  }
  for (const attack of weapon.attacks) {
    // A sweep's wedge must be convex: above 0 and at most 180 degrees.
    if (attack.strategy === 'melee-sweep' && !(attack.arcDegrees > 0 && attack.arcDegrees <= 180)) {
      problems.push('sweep arcDegrees must be above 0 and at most 180');
    }
  }
  problems.push(...new KnownProjectileRule(projectiles).check(weapon));
  problems.push(
    ...timeProblems(
      weapon.attacks.map(({ onHit }) => onHit),
      'onHit',
    ),
  );
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
 * Loads the weapons: attack intervals and `onHit` step times from seconds to ticks (architecture
 * 03 §11, DEC-241, as `loadDefaultContent` does for units), validated once. An `onHit` step's
 * other fields are its effect strategy's to check at boot (`checkAttackLinks`).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The weapons to load; the shipped set by default.
 * @param projectiles - The projectiles ranged attacks may fire; the shipped set by default.
 * @throws ContentValidationError listing every broken rule.
 */
export const loadWeapons = (
  tickRate: number,
  authored: readonly AuthoredWeaponDefinition[] = WEAPONS.all(),
  projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'has'> = PROJECTILES,
): ContentCatalogue<WeaponDefinition> => {
  const problems = authored.flatMap((weapon) => problemsOf(weapon, projectiles));
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
  const rate = new TickRate(tickRate);
  return new ContentCatalogue(
    authored.map((weapon): WeaponDefinition => ({
      ...weapon,
      attacks: weapon.attacks.map((attack) => attackInTicks(attack, rate)),
    })),
  );
};
