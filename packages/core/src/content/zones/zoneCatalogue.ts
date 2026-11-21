import { ContentCatalogue } from '../ContentCatalogue';
import { CAPTURE_POINT } from './capturePoint';
import { CATHEDRAL_CAPTURE_POINT } from './cathedralCapturePoint';
import type { ZoneDefinition, ZonePlacements } from './zones.types';

/** Every zone definition. */
export const ZONE_DEFINITIONS = new ContentCatalogue<ZoneDefinition>([
  CAPTURE_POINT,
  CATHEDRAL_CAPTURE_POINT,
]);

/**
 * The zone each map feature places (architecture 07 §7): one capture point where each lane
 * crosses the centre line, the middle one inside the Cathedral.
 */
export const ZONE_PLACEMENTS: ZonePlacements = {
  'capture-point': CAPTURE_POINT.id,
  cathedral: CATHEDRAL_CAPTURE_POINT.id,
};
