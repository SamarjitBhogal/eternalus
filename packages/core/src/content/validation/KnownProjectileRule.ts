import type { ContentCatalogue } from '../ContentCatalogue';
import type { ProjectileDefinition } from '../projectiles/projectiles.types';
import type { UnitAttack, UnitDefinition } from '../units/units.types';
import type { WeaponDefinition } from '../weapons/weapons.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * Every attack that fires a projectile (it has `projectile`, whatever its strategy), of a unit
 * definition (a mob's or turret's own attack) or of a weapon, must name a loaded projectile
 * (`projectileId`) and have a valid fall-off (05 §2): a typo fails at load, not at the first
 * shot. `loadWeapons` runs it over each weapon, so weapons and unit definitions share these checks.
 */
export class KnownProjectileRule implements UnitDefinitionRule {
  /** @param projectiles - The projectiles a ranged attack may fire. */
  public constructor(
    private readonly projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'has'>,
  ) {}

  /**
   * Flags each unknown `projectileId` and each fall-off that is not `0 < fullTo < floorAt`, floor
   * in (0, 1].
   */
  public check(definition: UnitDefinition | WeaponDefinition): readonly string[] {
    return KnownProjectileRule.attacksOf(definition).flatMap((attack) => this.problemsOf(attack));
  }

  private problemsOf(attack: UnitAttack): string[] {
    if (!('projectile' in attack)) {
      return [];
    }
    const { projectileId, falloff } = attack.projectile;
    const problems: string[] = [];
    if (!this.projectiles.has(projectileId)) {
      problems.push(`unknown projectile "${projectileId}"`);
    }
    if (falloff !== null) {
      if (!(
        falloff.fullTo > 0 &&
        falloff.fullTo < falloff.floorAt &&
        Number.isFinite(falloff.floorAt)
      )) {
        problems.push('falloff needs 0 < fullTo < floorAt');
      }
      if (!(falloff.floor > 0 && falloff.floor <= 1)) {
        problems.push('falloff floor must be in (0, 1]');
      }
    }
    return problems;
  }

  private static attacksOf(definition: UnitDefinition | WeaponDefinition): readonly UnitAttack[] {
    if ('attacks' in definition) {
      return definition.attacks;
    }
    return definition.attack === undefined ? [] : [definition.attack];
  }
}
