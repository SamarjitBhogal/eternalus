import type { Aim } from '../../components/AbilitySlotRuntime.types';
import { Health } from '../../components/Health';
import { Summoned } from '../../components/Summoned';
import { Transform } from '../../components/Transform';
import type {
  AbilityRejectReason,
  SummonSpec,
  WithoutTimes,
} from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { ObstacleDefinition } from '../../content/obstacles/obstacles.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import { normalize } from '../../utils/vec2';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBePositive, mustNotBeNegative } from '../specChecks';
import { summonPosition, summonPreview } from '../summonPlacement';

/**
 * Places one body from a definition, owned by the caster (architecture 05 §3 `SummonEffect`; a
 * Shield Wall, DEC-330 (7)): `distance` metres from the caster's centre along the cast's
 * direction, facing that way, through the `Summoner` port (`CastContext.summoner`), which also
 * makes a solid outline a wall. Each body carries its caster (`Summoned`). A caster holds at most
 * `maxActive` bodies of one definition: a new one first removes the caster's oldest standing one
 * as `despawned`, and one that is destroyed frees its place at once, also in the tick it breaks. A
 * body whose outline would overlap a wall or reach past the map's edge is not placed: the cast is
 * refused (`no-target`) before it spends anything (`aimBlockedBy`, which `CastValidator` asks).
 * The overlay draws the outline where the body will stand (`describe`). Each unit the new wall
 * pushes against something solid (`SummonResult.pinnedIds`) takes the impact damage of a
 * knock-back into a wall, once, credited to the caster under the cast's id, through the match's
 * one `DamagePipeline`, so friendly fire and the status multipliers apply (DEC-382, `INBOX.md`
 * HC-B43 (6)). The body stays when the caster dies. Only obstacles are summoned so far (the
 * content it is given).
 */
export class SummonEffect implements AbilityEffect<SummonSpec> {
  public readonly kind = 'summon';

  /**
   * @param definitions - The bodies a step may place, for their outline (`content/obstacles/`).
   * @param impactDamage - What a unit the new wall pins takes: the knock-back tuning's
   *   `impactDamage` (`content/abilities/knockback.ts`).
   */
  public constructor(
    private readonly definitions: {
      has(id: string): boolean;
      get(id: string): Pick<ObstacleDefinition, 'footprint'>;
    },
    private readonly impactDamage: number,
  ) {}

  /** A summon names a known body, a distance of 0 or more and a whole cap of at least 1. */
  public validate(spec: SummonSpec): readonly string[] {
    return [
      ...(this.definitions.has(spec.definitionId)
        ? []
        : [`summon definition "${spec.definitionId}" is unknown`]),
      ...mustNotBeNegative(spec.distance, 'summon distance'),
      ...(Number.isInteger(spec.maxActive)
        ? mustBePositive(spec.maxActive, 'summon maxActive')
        : ['summon maxActive must be a whole number']),
    ];
  }

  /**
   * The body's outline, `distance` ahead along the aim, so the overlay shows where it will stand;
   * nothing for a body with no outline.
   */
  public describe({
    kind,
    definitionId,
    distance,
  }: WithoutTimes<SummonSpec>): readonly AbilityDisplayStep[] {
    const { footprint } = this.definitions.get(definitionId);
    return footprint === undefined
      ? []
      : [{ kind, shape: { kind: 'outline', corners: footprint, distance } }];
  }

  /**
   * `no-target` when the body's outline, placed for a cast of `casterId` aimed at `aim.point`,
   * would overlap a wall or reach past the map's edge (`summonPreview`, the rule the aim
   * preview also uses); `null` otherwise, and always without walls (no map objects), an outline or
   * a direction.
   */
  public aimBlockedBy(
    spec: SummonSpec,
    { point }: Aim,
    casterId: EntityId,
    state: GameState,
  ): AbilityRejectReason | null {
    const centre = state.entities.get(casterId)?.findComponent(Transform)?.position;
    const { footprint } = this.definitions.get(spec.definitionId);
    if (centre === undefined || footprint === undefined) return null;
    const direction = normalize({ x: point.x - centre.x, y: point.y - centre.y });
    return summonPreview(state.walls, footprint, centre, direction, spec.distance)?.isBlocked ===
      true
      ? 'no-target'
      : null;
  }

  /**
   * Removes the caster's oldest standing bodies over the cap, then places the new one, owned by
   * the caster, and hits each unit it pins. A body destroyed earlier in this tick still waits for
   * `DeathSystem` to remove it, so it does not count: it frees its place at once.
   */
  public apply(spec: SummonSpec, cast: CastContext): void {
    const { state, casterId, direction } = cast;
    const { definitionId, maxActive } = spec;
    const standing = SummonEffect.standingOf(state, casterId, definitionId);
    for (const oldest of standing.slice(0, Math.max(0, standing.length + 1 - maxActive))) {
      cast.summoner.despawn(state, oldest);
    }
    const centre = cast.placement.to;
    const { pinnedIds } = cast.summoner.summon(
      state,
      definitionId,
      { position: summonPosition(centre, direction, spec.distance), facing: direction },
      casterId,
    );
    for (const targetId of pinnedIds) {
      cast.damage.apply(state, targetId, this.impactDamage, {
        attackerId: casterId,
        kind: 'ability',
        definitionId: cast.abilityId,
      });
    }
  }

  /**
   * The bodies built from `definitionId` that `casterId` placed (`Summoned`) and that still stand
   * (not dead), oldest first. Oldest first is the store's order: `EntityStore` keeps the order
   * bodies were added in, the summoner adds a body the moment it is cast, and no body is ever
   * added again. The caller removes bodies only after this walk (`forEach` skips an entity
   * removed during it).
   */
  private static standingOf(
    state: GameState,
    casterId: EntityId,
    definitionId: string,
  ): readonly EntityId[] {
    const standing: EntityId[] = [];
    state.entities.forEach((entity) => {
      if (
        entity.definitionId === definitionId &&
        entity.findComponent(Summoned)?.ownerId === casterId &&
        entity.findComponent(Health)?.isDead !== true
      )
        standing.push(entity.id);
    });
    return standing;
  }
}
