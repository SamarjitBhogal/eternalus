import type { ProjectileSpec, WithoutTimes } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { ProjectileDefinition } from '../../content/projectiles/projectiles.types';
import { AreaHitQuery } from '../../state/AreaHitQuery';
import type { AbilityEffect, CastContext, NestedDescriber } from '../AbilityEffect.types';

/**
 * Throws a shot along the cast's direction (architecture 05 §3; Hamstring, DEC-268): the
 * projectile the step names, from where the step sits (the caster), for the caster's team and
 * fired at no unit, so it stops at the first enemy body it touches and passes allies
 * (`ProjectileSystem`). A walk-on outline (a palace floor, a gate's passage) stops it only when the
 * cast's aim point is on it (`AreaHitQuery.aimedBodyOf`, DEC-322 (1)). The shot names only that
 * outline: unlike a weapon's shot, it does not name the cast's `aim.targetId` (`INBOX.md` HC-B26
 * (2)). Its impact carries the step's `onHit` steps as plain data, which `AbilityImpact` runs on
 * that body when the shot lands. The flight (speed, width, range) is the projectile's definition,
 * by id: one place for it, as for a weapon's shot (DEC-314 (5)).
 */
export class ProjectileEffect implements AbilityEffect<ProjectileSpec> {
  public readonly kind = 'projectile';
  /** The one hit rule for areas, for the walk-on outline the aim point names (stateless). */
  private readonly areas = new AreaHitQuery();

  /**
   * @param projectiles - The projectiles a step may name, for their range and width
   *   (`content/projectiles/`).
   */
  public constructor(
    private readonly projectiles: {
      has(id: string): boolean;
      get(id: string): Pick<ProjectileDefinition, 'range' | 'footprintRadius'>;
    },
  ) {}

  /** A shot names a known projectile; the registry checks its `onHit` steps. */
  public validate(spec: ProjectileSpec): readonly string[] {
    return this.projectiles.has(spec.projectileId)
      ? []
      : [`projectile "${spec.projectileId}" is unknown`];
  }

  /**
   * The shot's own row: its range as `distance` and its width as a `path`, so the overlay draws
   * the line it flies, stopped where a dash of the caster's size stops; then its `onHit` steps'
   * rows.
   */
  public describe(
    spec: WithoutTimes<ProjectileSpec>,
    nested: NestedDescriber,
  ): readonly AbilityDisplayStep[] {
    const { range, footprintRadius } = this.projectiles.get(spec.projectileId);
    return [
      { kind: this.kind, distance: range, shape: { kind: 'path', width: 2 * footprintRadius } },
      ...spec.onHit.flatMap(nested),
    ];
  }

  /**
   * Launches the shot from the step's placement along the cast's direction, credited to the
   * caster under the ability.
   *
   * @throws Error when the caster has no team: the cast check passed a live unit, which has one.
   */
  public apply(spec: ProjectileSpec, cast: CastContext): void {
    const team = cast.state.entities.teamOf(cast.casterId);
    if (team === undefined) {
      throw new Error(`ProjectileEffect: the caster "${cast.casterId}" has no team.`);
    }
    const origin = cast.placement.to;
    cast.launcher.launch(
      cast.state,
      spec.projectileId,
      {
        ownerId: cast.casterId,
        team,
        source: { attackerId: cast.casterId, kind: 'ability', definitionId: cast.abilityId },
        targetId: this.areas.aimedBodyOf(cast.state.entities, cast.casterId, cast.aim.point),
        impact: {
          kind: 'ability',
          abilityId: cast.abilityId,
          slot: cast.slot,
          onHit: spec.onHit,
          scaling: cast.scaling,
          casterLevel: cast.casterLevel,
        },
        origin: { x: origin.x, y: origin.y },
      },
      cast.direction,
    );
  }
}
