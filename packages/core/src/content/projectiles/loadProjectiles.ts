import { TickRate } from '../../utils/TickRate';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { createProjectileRules } from '../defaultContentRules';
import { stepInTicks, timeProblems } from '../timesInTicks';
import { ContentValidator } from '../validation/ContentValidator';
import { PROJECTILES } from './projectileCatalogue';
import type { AuthoredProjectile, ProjectileDefinition } from './projectiles.types';

const isPositive = (value: number): boolean => value > 0 && Number.isFinite(value);

/**
 * What is wrong with `projectile` as authored, or nothing: its own numbers, then the projectile
 * rules (`createProjectileRules`).
 */
const problemsOf = (
  projectile: AuthoredProjectile,
  tickRate: number,
  validator: ContentValidator<AuthoredProjectile>,
  catalogue: ContentCatalogue<AuthoredProjectile>,
): string[] => {
  const problems: string[] = [];
  if (!isPositive(projectile.footprintRadius)) problems.push('footprintRadius must be positive');
  if (!isPositive(projectile.range)) problems.push('range must be positive');
  if (!isPositive(projectile.movementProfile.maxSpeed)) problems.push('maxSpeed must be positive');
  if (!(projectile.slowFrom > 0 && projectile.slowFrom <= projectile.range)) {
    problems.push('slowFrom must be above 0 and at most range');
  }
  if (!isPositive(projectile.endDuration)) problems.push('endDuration must be positive');
  // At least one tick of flight, so the first full-speed move cannot pass the end.
  if (projectile.range < projectile.movementProfile.maxSpeed / tickRate) {
    problems.push('range must be at least one tick of flight');
  }
  problems.push(...timeProblems(projectile.litOnHit, 'litOnHit'));
  problems.push(...validator.problemsOf(projectile, catalogue));
  return problems.map((problem) => `Projectile "${projectile.id}": ${problem}.`);
};

/**
 * Loads the projectiles: speeds from metres per second to metres per tick (architecture 03 §11,
 * DEC-241), `endDuration` and the times of `litOnHit` steps from seconds to ticks. A shot is at full speed in its first tick, so
 * acceleration is the top speed.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The projectiles to load; the shipped set by default.
 * @throws ContentValidationError listing every broken rule.
 */
export const loadProjectiles = (
  tickRate: number,
  authored: readonly AuthoredProjectile[] = PROJECTILES.all(),
): ContentCatalogue<ProjectileDefinition> => {
  const catalogue = new ContentCatalogue(authored);
  const validator = new ContentValidator(createProjectileRules());
  const problems = authored.flatMap((projectile) =>
    problemsOf(projectile, tickRate, validator, catalogue),
  );
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
  const rate = new TickRate(tickRate);
  return new ContentCatalogue(
    authored.map(({ litOnHit, ...projectile }): ProjectileDefinition => {
      const speed = rate.perTick(projectile.movementProfile.maxSpeed);
      return {
        ...projectile,
        ...(litOnHit === undefined
          ? {}
          : { litOnHit: litOnHit.map((step) => stepInTicks(step, rate)) }),
        endDuration: rate.toTicks(projectile.endDuration),
        movementProfile: { ...projectile.movementProfile, maxSpeed: speed, acceleration: speed },
      };
    }),
  );
};
