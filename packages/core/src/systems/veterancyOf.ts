import { Veterancy } from '../components/Veterancy';
import type { Entity } from '../entities/Entity';

/**
 * The `Veterancy` of `entity`, added on first use (a minion's first kill or level). Shared by
 * `VeterancySystem` (kills) and `MinionLevelSystem` (levels), which may not import each other.
 */
export const veterancyOf = (entity: Entity): Veterancy => {
  const found = entity.findComponent(Veterancy);
  if (found !== undefined) {
    return found;
  }
  const veterancy = new Veterancy();
  entity.addComponent(veterancy);
  return veterancy;
};
