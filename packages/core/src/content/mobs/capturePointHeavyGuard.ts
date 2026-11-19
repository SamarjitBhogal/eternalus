import { HEAVY_GUARD } from './heavyGuard';
import type { MobDefinition } from './mobs.types';

/**
 * The capture point's heavy support mob (architecture 18 §7.1, reference 04 "along with
 * high-power enemy and support mobs"): the heavy tower guard with the court's aggro profile, whose
 * radius follows the court's leash (AI56-F4).
 */
export const CAPTURE_POINT_HEAVY_GUARD = {
  ...HEAVY_GUARD,
  id: 'capture-point-heavy-guard',
  aiProfile: 'capture-point-guard',
} as const satisfies MobDefinition;
