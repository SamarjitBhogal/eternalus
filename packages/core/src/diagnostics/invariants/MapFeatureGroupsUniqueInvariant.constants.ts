import { Capturable } from '../../components/Capturable';
import { Health } from '../../components/Health';
import type { ComponentType } from '../../entities/Entity.types';
import type { EntitySnapshot } from '../../state/Snapshot.types';

/**
 * The snapshot groups a consumer reads by map feature id (the HUD's structure health and capture
 * points, DEC-233), each with the component behind it.
 */
export const FEATURE_GROUPS = {
  health: Health,
  capture: Capturable,
} as const satisfies Partial<Record<keyof EntitySnapshot, ComponentType>>;
