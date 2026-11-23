import { TickRate } from '../../utils/TickRate';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { createStructureRules } from '../defaultContentRules';
import { PROJECTILES } from '../projectiles/projectileCatalogue';
import type { ProjectileDefinition } from '../projectiles/projectiles.types';
import { ContentValidator } from '../validation/ContentValidator';
import { KEBAB_CASE } from '../validation/KebabCaseIdRule.constants';
import { KnownProjectileRule } from '../validation/KnownProjectileRule';
import { attackInTicks, isNonNegative, timeProblems } from '../timesInTicks';
import { STRUCTURE_DEFINITIONS } from './structureCatalogue';
import type { StructureDefinition } from './structures.types';
import { TURRET_PROFILES } from '../ai/turret';
import { TURRET_AMMO } from './turretAmmo';
import type { AuthoredTurretProfile, TurretProfileDefinition } from '../ai/turret.types';
import type { AuthoredTurretAmmo, TurretAmmoDefinition } from './turrets.types';

/**
 * The turret content as authored: the ammo table, the profiles, and the structure definitions,
 * whose `ammo` lists name the ammo each turret carries.
 */
type AuthoredTurrets = {
  readonly ammo: readonly AuthoredTurretAmmo[];
  readonly profiles: readonly AuthoredTurretProfile[];
  readonly structures: readonly StructureDefinition[];
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
  problems.push(...timeProblems(ammo.attack.onHit, 'onHit'));
  return problems.map((problem) => `Turret ammo "${ammo.id}": ${problem}.`);
};

/** What is wrong with `profile` as authored, or nothing. */
const profileProblems = (profile: AuthoredTurretProfile): string[] => {
  const problems: string[] = [];
  if (!KEBAB_CASE.test(profile.id)) problems.push('id must be kebab-case');
  if (!isPositive(profile.range)) problems.push('range must be positive');
  if (!isNonNegative(profile.defendAllySeconds)) {
    problems.push('defendAllySeconds must not be negative');
  }
  return problems.map((problem) => `Turret profile "${profile.id}": ${problem}.`);
};

/**
 * What is wrong with the ammo list of `structure`, given the ammo and the profiles by id, or
 * nothing: each id names an ammo that reaches the range of the structure's profile (when that is a
 * turret profile), and the last one fits any target.
 */
const carriedAmmoProblems = (
  { id, ammo: carried = [], aiProfile, controller }: StructureDefinition,
  ammoById: ReadonlyMap<string, AuthoredTurretAmmo>,
  profileById: ReadonlyMap<string, AuthoredTurretProfile>,
): string[] => {
  const profile = profileById.get(aiProfile ?? controller ?? '');
  const problems: string[] = [];
  for (const ammoId of carried) {
    const ammo = ammoById.get(ammoId);
    if (ammo === undefined) {
      problems.push(`unknown ammo "${ammoId}"`);
    } else if (profile !== undefined && ammo.attack.reach < profile.range) {
      problems.push(`ammo "${ammoId}" reaches less than the range of "${profile.id}"`);
    }
  }
  if (ammoById.get(carried.at(-1) ?? '')?.preferredAgainst !== 'any') {
    problems.push('the last ammo must be preferred against any target');
  }
  return problems.map((problem) => `Structure "${id}": ${problem}.`);
};

/**
 * What is wrong with `structure` under the structure rules (`createStructureRules`: a turret needs
 * ammo, ammo needs the turret controller), or nothing.
 */
const structureRuleProblems = (
  structure: StructureDefinition,
  validator: ContentValidator<StructureDefinition>,
  catalogue: ContentCatalogue<StructureDefinition>,
): string[] =>
  validator
    .problemsOf(structure, catalogue)
    .map((problem) => `Structure "${structure.id}": ${problem}.`);

/**
 * Loads the turret content (architecture 07 §5, 11 §4.5): each ammo's attack interval and its
 * `onHit` steps' times from seconds to ticks (`attackInTicks`, as a weapon's), and each profile's
 * defend-ally window to ticks, once (architecture 03 §8, DEC-241). The window keeps 0 (only this
 * tick's hits); an interval is at least one tick. It also checks every structure definition
 * against the structure rules (`createStructureRules`) and the ammo list of every one that names
 * one. The `onHit` steps' own fields are their effect strategies' to check at boot
 * (`checkAttackLinks`).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The ammo, profiles and structures to load and check; each the shipped one
 *   when omitted. `Simulation` passes the structures it builds from.
 * @param projectiles - The projectiles an ammo may fire; the shipped set by default.
 * @throws ContentValidationError listing every broken rule: a bad id, a damage, reach or interval
 *   that is not positive, an unknown projectile, a negative time, a range that is not positive, a
 *   structure that names an unknown ammo or an ammo that reaches less than its profile's range, or
 *   whose last ammo is not preferred against any target (so some target would get none), a turret
 *   with no ammo list, or ammo on a structure the turret controller does not drive.
 */
export const loadTurrets = (
  tickRate: number,
  {
    ammo = TURRET_AMMO.all(),
    profiles = TURRET_PROFILES.all(),
    structures = STRUCTURE_DEFINITIONS.all(),
  }: Partial<AuthoredTurrets> = {},
  projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'has'> = PROJECTILES,
): TurretContent => {
  const ammoById = new Map(ammo.map((ammo) => [ammo.id, ammo]));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const structureCatalogue = new ContentCatalogue(structures);
  const structureValidator = new ContentValidator(createStructureRules());
  const problems = [
    ...ammo.flatMap((entry) => ammoProblems(entry, projectiles)),
    ...profiles.flatMap(profileProblems),
    ...structures.flatMap((structure) =>
      structureRuleProblems(structure, structureValidator, structureCatalogue),
    ),
    ...structures
      .filter((structure) => structure.ammo !== undefined)
      .flatMap((structure) => carriedAmmoProblems(structure, ammoById, profileById)),
  ];
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
  const rate = new TickRate(tickRate);
  return {
    ammo: new ContentCatalogue(
      ammo.map((entry): TurretAmmoDefinition => ({
        ...entry,
        attack: attackInTicks(entry.attack, rate),
      })),
    ),
    profiles: new ContentCatalogue(
      profiles.map(({ defendAllySeconds, ...profile }): TurretProfileDefinition => ({
        ...profile,
        defendAllyTicks: rate.roundToTicks(defendAllySeconds),
      })),
    ),
  };
};
