import type { Aim } from '../../components/AbilitySlotRuntime.types';
import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { StatusEffects } from '../../components/StatusEffects';
import { Transform } from '../../components/Transform';
import type {
  AbilityRejectReason,
  AbilityRestrictionSpec,
} from '../../content/abilities/AbilityDefinition.types';
import type { GameState } from '../../state/GameState';
import { doesCircleOverlapPolygon } from '../../utils/circlePolygon';
import { CONTACT_EPSILON } from '../../utils/circlePolygon.constants';
import { normalize } from '../../utils/vec2';
import { fieldRectangle } from '../fieldGeometry';
import type { AbilityRestriction } from '../AbilityRestriction.types';

/** A new solid wall must not enclose an existing unit or projectile. */
export class RoomForWallRestriction implements AbilityRestriction<
  Extract<AbilityRestrictionSpec, { kind: 'room-for-wall' }>
> {
  public readonly kind = 'room-for-wall';
  /** Aim-dependent placement is checked at cast time, before spending aether. */
  public check(
    spec: Extract<AbilityRestrictionSpec, { kind: 'room-for-wall' }>,
    casterId: string,
    state: GameState,
    aim?: Aim | null,
  ): AbilityRejectReason | null {
    if (aim == null) return null;
    const caster = state.entities.get(casterId)?.findComponent(Transform);
    if (caster === undefined) return 'restricted';
    const delta = { x: aim.point.x - caster.position.x, y: aim.point.y - caster.position.y };
    const direction = delta.x === 0 && delta.y === 0 ? caster.facing : normalize(delta);
    const from = {
      x: caster.position.x + direction.x * (caster.radius + CONTACT_EPSILON),
      y: caster.position.y + direction.y * (caster.radius + CONTACT_EPSILON),
    };
    const polygon = fieldRectangle(from, direction, spec.thickness, spec.width);
    const occupiedBodies: string[] = [];
    state.entities.forEach((entity) => {
      const collider = entity.findComponent(Collider);
      const body = entity.findComponent(Transform);
      if (
        occupiedBodies.length > 0 ||
        entity.id === casterId ||
        collider?.isEnabled !== true ||
        collider.isStatic ||
        body === undefined ||
        entity.findComponent(Health)?.isDead === true
      )
        return;
      const scale = entity.findComponent(StatusEffects)?.multiplier('size') ?? 1;
      if (
        doesCircleOverlapPolygon(
          body.position,
          (body.radius / body.sizeMultiplier) * scale,
          polygon,
        )
      )
        occupiedBodies.push(entity.id);
    });
    return occupiedBodies.length > 0 ? 'restricted' : null;
  }
}
