import { Capturable } from '../../components/Capturable';
import { Health } from '../../components/Health';
import type { FeatureKeyedGroup } from '../../state/Snapshot.types';

/**
 * Each snapshot group a consumer reads by map feature id (`FeatureKeyedGroup`: the HUD's structure
 * health and capture points, DEC-233), with the component behind it; exactly those groups (DEC-256).
 */
export const FEATURE_GROUPS = {
  health: Health,
  capture: Capturable,
} as const satisfies Record<FeatureKeyedGroup, unknown>;
