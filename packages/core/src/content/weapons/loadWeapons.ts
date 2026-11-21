import { TickRate } from '../../utils/TickRate';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { KEBAB_CASE } from '../validation/KebabCaseIdRule.constants';
import { PROJECTILES } from '../projectiles/projectileCatalogue';
import { WEAPONS } from './weaponCatalogue';
import type { ProjectileDefinition } from '../projectiles/projectiles.types';
import type { ProjectileLaunch } from '../units/units.types';
import type { WeaponDefinition } from './weapons.types';

const isPositive = (value: number): boolean => value > 0 && Number.isFinite(value);

/** What is wrong with the shot an attack fires, or nothing. */
const projectileProblems = (
  { projectileId, falloff }: ProjectileLaunch,
  projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'has'>,
): string[] => {
  const problems: string[] = [];
  if (!projectiles.has(projectileId)) problems.push(`unknown projectile "${projectileId}"`);
  if (falloff !== null) {
    if (!(
      falloff.fullTo > 0 &&
      falloff.fullTo < falloff.floorAt &&
      Number.isFinite(falloff.floorAt)
    )) {
      problems.push('falloff needs 0 < fullTo < floorAt');
    }
    if (!(falloff.floor > 0 && falloff.floor <= 1))
      problems.push('falloff floor must be in (0, 1]');
  }
  return problems;
};

/** What is wrong with `weapon` as authored, or nothing. */
const problemsOf = (
  weapon: WeaponDefinition,
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
    if (attack.strategy === 'ranged-projectile') {
      problems.push(...projectileProblems(attack.projectile, projectiles));
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
 * Loads the weapons: attack intervals from seconds to ticks (architecture 03 §11, as
 * `loadDefaultContent` does for units), validated once.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The weapons to load; the shipped set by default.
 * @param projectiles - The projectiles ranged attacks may fire; the shipped set by default.
 * @throws ContentValidationError listing every broken rule.
 */
export const loadWeapons = (
  tickRate: number,
  authored: readonly WeaponDefinition[] = WEAPONS.all(),
  projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'has'> = PROJECTILES,
): ContentCatalogue<WeaponDefinition> => {
  const problems = authored.flatMap((weapon) => problemsOf(weapon, projectiles));
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
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
