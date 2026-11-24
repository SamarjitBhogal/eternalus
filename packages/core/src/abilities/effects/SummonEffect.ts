import type { Aim } from '../../components/AbilitySlotRuntime.types';
import { Transform } from '../../components/Transform';
import type {
  AbilityRejectReason,
  SummonSpec,
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
 * makes a solid outline a wall. A caster holds at most `maxActive` bodies of one definition
 * (`GameState.summons`): a new one first removes the caster's oldest as `despawned`, and one that
 * is destroyed frees its place. A body whose outline would overlap a wall or reach past the map's
 * edge is not placed: the cast is refused (`no-target`) before it spends anything
 * (`aimBlockedBy`, which `CastValidator` asks). The body stays when the caster dies. Only
 * obstacles are summoned so far (the content it is given).
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

  /** Nothing: the overlay has no shape for a placed body yet. */
  public describe(): readonly AbilityDisplayStep[] {
    return [];
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

  /** Removes the caster's oldest bodies over the cap, then places the new one and records it. */
  public apply(spec: SummonSpec, cast: CastContext): void {
    const { state, casterId, direction } = cast;
    const { definitionId, maxActive } = spec;
    const placed = state.summons.placedBy(casterId, definitionId);
    for (const oldest of placed.slice(0, Math.max(0, placed.length + 1 - maxActive))) {
      cast.summoner.despawn(state, oldest);
    }
    const centre = cast.placement.to;
    const id = cast.summoner.summon(state, definitionId, {
      position: SummonEffect.ahead(spec, centre, direction),
      facing: direction,
    });
    state.summons.record(casterId, definitionId, id);
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
