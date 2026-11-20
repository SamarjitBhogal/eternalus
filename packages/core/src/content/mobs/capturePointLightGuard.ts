import { LIGHT_GUARD } from './lightGuard';
import type { MobDefinition } from './mobs.types';

/**
 * The capture point's light support mob (architecture 18 §7.1): the light tower guard with the
 * court's aggro profile, whose radius follows the court's leash (AI56-F4).
 */
export const CAPTURE_POINT_LIGHT_GUARD = {
  ...LIGHT_GUARD,
  id: 'capture-point-light-guard',
  aiProfile: 'capture-point-guard',
} as const satisfies MobDefinition;
