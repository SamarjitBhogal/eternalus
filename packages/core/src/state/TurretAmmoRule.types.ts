import type { TurretAmmoDefinition } from '../content/structures/turrets.types';

/**
 * A turret's ammo as `ai/` and `commands/` read it (`TurretAmmoRule.ammoOf`): what it carries,
 * best first, and the id of the one it has loaded (architecture 07 §5 `TurretState`).
 */
export type TurretAmmoView = {
  readonly ammo: readonly TurretAmmoDefinition[];
  readonly loadedId: string;
};
