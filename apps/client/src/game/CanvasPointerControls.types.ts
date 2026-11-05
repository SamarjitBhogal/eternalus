import type { MatchViewport } from './MatchViewport.types';
import type { MatchViewControls } from './MatchViewControls';

/** What the canvas pointer controls drive and listen on. */
export type CanvasPointerControlsDeps = {
  /** The match's view controls (`Match.controls`). */
  readonly controls: Pick<
    MatchViewControls,
    | 'lookAtMinimapPoint'
    | 'panBy'
    | 'zoomBy'
    | 'toggleRoofAt'
    | 'attackAt'
    | 'hasDeveloperRoofs'
    | 'overview'
    | 'leaveExplorer'
    | 'setPointerClaimed'
  >;
  /**
   * The canvas, its chrome, and whether the developer explorer is on (`?dev=1`; DEC-32, INBOX
   * HC-F8).
   */
  readonly viewport: MatchViewport;
};
