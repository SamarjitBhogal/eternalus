import { Footprint } from '../components/Footprint';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import type { Rect } from '../utils/geometry.types';

/**
 * The box a structure's area is measured beyond (DEC-323): the entity's `Footprint` box, the fort
 * box `PathingWorld.forts` also holds, so the court, the doorways and the walls lie inside it;
 * else a box of no size at the entity's centre. `undefined` when it has neither, so there is no
 * place to measure from. `StructureAuraSystem` and the snapshot read it for an aura's radius
 * (DEC-323 (3)), so the field the client draws is the ground the aura covers; the lane index keeps
 * it for a bot's `Defend` (`LaneStructureEntry.box`, DEC-323 (2)).
 */
export const outlineBoxOf = (entity: Entity): Rect | undefined => {
  const bounds = entity.findComponent(Footprint)?.bounds;
  if (bounds !== undefined) {
    return bounds;
  }
  const position = entity.findComponent(Transform)?.position;
  return position === undefined ? undefined : { x: position.x, y: position.y, width: 0, height: 0 };
};
