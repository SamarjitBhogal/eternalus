import { TickRate } from '../../utils/TickRate';
import { stepInTicks, timeProblems } from '../abilities/loadAbilities';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { PROJECTILES } from '../projectiles/projectileCatalogue';
import type { ProjectileDefinition } from '../projectiles/projectiles.types';
import { KEBAB_CASE } from '../validation/KebabCaseIdRule.constants';
import { KnownProjectileRule } from '../validation/KnownProjectileRule';
import { TURRET_PROFILES } from './turret';
import { TURRET_AMMO } from './turretAmmo';
import type {
  AuthoredTurretAmmo,
  AuthoredTurretProfile,
  TurretAmmoDefinition,
  TurretProfileDefinition,
} from './turrets.types';

/** The turret content as authored: the ammo table and the profiles that load it. */
type AuthoredTurrets = {
  readonly ammo: readonly AuthoredTurretAmmo[];
  readonly profiles: readonly AuthoredTurretProfile[];
};

/** The turret content as loaded (`loadTurrets`), each keyed by id. */
export type TurretContent = {
  readonly ammo: ContentCatalogue<TurretAmmoDefinition>;
  readonly profiles: ContentCatalogue<TurretProfileDefinition>;
};

const isPositive = (value: number): boolean => value > 0 && Number.isFinite(value);

/** What is wrong with `ammo` as authored, or nothing. */
const ammoProblems = (
  ammo: AuthoredTurretAmmo,
  projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'has'>,
): string[] => {
  const problems: string[] = [];
  if (!KEBAB_CASE.test(ammo.id)) problems.push('id must be kebab-case');
  for (const field of ['damage', 'reach', 'interval'] as const) {
    if (!isPositive(ammo.attack[field])) problems.push(`attack ${field} must be positive`);
  }
  problems.push(...new KnownProjectileRule(projectiles).check(ammo));
  problems.push(...timeProblems(ammo.onHit, 'onHit'));
  return problems.map((problem) => `Turret ammo "${ammo.id}": ${problem}.`);
};

/** What is wrong with `profile` as authored, given the ammo by id, or nothing. */
const profileProblems = (
  profile: AuthoredTurretProfile,
  ammoById: ReadonlyMap<string, AuthoredTurretAmmo>,
): string[] => {
  const problems: string[] = [];
  if (!KEBAB_CASE.test(profile.id)) problems.push('id must be kebab-case');
  if (!isPositive(profile.range)) problems.push('range must be positive');
  if (!(profile.defendAllySeconds >= 0 && Number.isFinite(profile.defendAllySeconds))) {
    problems.push('defendAllySeconds must not be negative');
  }
  for (const id of profile.ammo) {
    const ammo = ammoById.get(id);
    if (ammo === undefined) {
      problems.push(`unknown ammo "${id}"`);
    } else if (ammo.attack.reach < profile.range) {
      problems.push(`ammo "${id}" reaches less than the range`);
    }
  }
  const last = ammoById.get(profile.ammo.at(-1) ?? '');
  if (last?.preferredAgainst !== 'any') {
    problems.push('the last ammo must be preferred against any target');
  }
  return problems.map((problem) => `Turret profile "${profile.id}": ${problem}.`);
};

/**
 * Loads the turret content (architecture 07 §5, 11 §4.5): each ammo's interval from seconds to
 * ticks and its `onHit` steps' times to ticks, and each profile's defend-ally window to ticks,
 * once (architecture 03 §8, DEC-241). The window keeps 0 (only this tick's hits); an interval is
 * at least one tick. The `onHit` steps' own fields are their effect strategies' to check when the
 * shot is wired (as a status's `onHit` steps, `checkStatusLinks`).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The ammo and profiles to load; the shipped ones by default.
 * @param projectiles - The projectiles an ammo may fire; the shipped set by default.
 * @throws ContentValidationError listing every broken rule: a bad id, a damage, reach or interval
 *   that is not positive, an unknown projectile, a negative time, a range that is not positive, an
 *   unknown ammo, an ammo that reaches less than the profile's range, or a profile whose last ammo
 *   is not preferred against any target (so some target would get none).
 */
export const loadTurrets = (
  tickRate: number,
  authored: AuthoredTurrets = { ammo: TURRET_AMMO.all(), profiles: TURRET_PROFILES.all() },
  projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'has'> = PROJECTILES,
): TurretContent => {
  const ammoById = new Map(authored.ammo.map((ammo) => [ammo.id, ammo]));
  const problems = [
    ...authored.ammo.flatMap((ammo) => ammoProblems(ammo, projectiles)),
    ...authored.profiles.flatMap((profile) => profileProblems(profile, ammoById)),
  ];
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
  const rate = new TickRate(tickRate);
  return {
    ammo: new ContentCatalogue(
      authored.ammo.map((ammo): TurretAmmoDefinition => ({
        ...ammo,
        attack: { ...ammo.attack, interval: rate.toTicks(ammo.attack.interval) },
        onHit: ammo.onHit.map((step) => stepInTicks(step, rate)),
      })),
    ),
    profiles: new ContentCatalogue(
      authored.profiles.map(({ defendAllySeconds, ...profile }): TurretProfileDefinition => ({
        ...profile,
        defendAllyTicks: rate.roundToTicks(defendAllySeconds),
      })),
    ),
  };
};
