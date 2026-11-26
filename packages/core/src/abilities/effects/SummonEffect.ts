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
import { placePolygon } from '../../utils/geometry';
import type { Polygon, Vec2 } from '../../utils/geometry.types';
import { normalize } from '../../utils/vec2';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBePositive, mustNotBeNegative } from '../specChecks';

/**
 * Places one body from a definition, owned by the caster (architecture 05 §3 `SummonEffect`; a
 * Shield Wall, DEC-330 (7)): `distance` metres from the caster's centre along the cast's
 * direction, facing that way, through the `Summoner` port (`CastContext.summoner`), which also
 * makes a solid outline a wall. Each body carries its caster (`Summoned`). A caster holds at most
 * `maxActive` bodies of one definition: a new one first removes the caster's oldest standing one
 * as `despawned`, and one that is destroyed frees its place at once, also in the tick it breaks. A
 * body whose outline would overlap a wall or reach past the map's edge is not placed: the cast is
 * refused (`no-target`) before it spends anything (`aimBlockedBy`, which `CastValidator` asks).
 * The overlay draws the outline where the body will stand (`describe`). The body stays when the
 * caster dies. Only obstacles are summoned so far (the content it is given).
 */
export class SummonEffect implements AbilityEffect<SummonSpec> {
  public readonly kind = 'summon';

  /** @param definitions - The bodies a step may place, for their outline (`content/obstacles/`). */
  public constructor(
    private readonly definitions: {
      has(id: string): boolean;
      get(id: string): Pick<ObstacleDefinition, 'footprint'>;
    },
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
   * would overlap a wall or reach past the map's edge (`PlacedWalls.isBlocked`); `null` otherwise,
   * and always without walls (no map objects) or an outline.
   */
  public aimBlockedBy(
    spec: SummonSpec,
    { point }: Aim,
    casterId: EntityId,
    state: GameState,
  ): AbilityRejectReason | null {
    const centre = state.entities.get(casterId)?.findComponent(Transform)?.position;
    if (centre === undefined || state.walls === null) return null;
    const toAim = { x: point.x - centre.x, y: point.y - centre.y };
    if (toAim.x === 0 && toAim.y === 0) return null;
    const outline = this.outlineAt(spec, centre, normalize(toAim));
    return outline !== null && state.walls.isBlocked(outline) ? 'no-target' : null;
  }

  /**
   * Removes the caster's oldest standing bodies over the cap, then places the new one, owned by
   * the caster. A body destroyed earlier in this tick still waits for `DeathSystem` to remove it,
   * so it does not count: it frees its place at once.
   */
  public apply(spec: SummonSpec, cast: CastContext): void {
    const { state, casterId, direction } = cast;
    const { definitionId, maxActive } = spec;
    const standing = SummonEffect.standingOf(state, casterId, definitionId);
    for (const oldest of standing.slice(0, Math.max(0, standing.length + 1 - maxActive))) {
      cast.summoner.despawn(state, oldest);
    }
    const centre = cast.placement.to;
    cast.summoner.summon(
      state,
      definitionId,
      { position: SummonEffect.ahead(spec, centre, direction), facing: direction },
      casterId,
    );
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

  /** Where the body stands: `distance` from `centre` along `direction`. */
  private static ahead({ distance }: SummonSpec, centre: Vec2, direction: Vec2): Vec2 {
    return { x: centre.x + direction.x * distance, y: centre.y + direction.y * distance };
  }

  /** The body's outline in the world, or `null` for a body with none. */
  private outlineAt(spec: SummonSpec, centre: Vec2, direction: Vec2): Polygon | null {
    const { footprint } = this.definitions.get(spec.definitionId);
    return footprint === undefined
      ? null
      : placePolygon(footprint, SummonEffect.ahead(spec, centre, direction), direction);
  }
}
