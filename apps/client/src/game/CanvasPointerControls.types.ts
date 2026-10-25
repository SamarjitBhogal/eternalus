import type { Match } from './Match';
import type { MatchViewport } from './MatchViewport.types';

/** What the canvas pointer controls drive and listen on. */
export type CanvasPointerControlsDeps = {
  readonly match: Pick<
    Match,
    'lookAtMinimapPoint' | 'panBy' | 'zoomBy' | 'enterAt' | 'overview' | 'leaveInterior'
  >;
  /**
   * The canvas, its chrome, and whether the developer explorer is on (`?dev=1`; DEC-32, INBOX
   * HC-F8).
   */
  readonly viewport: MatchViewport;
};
