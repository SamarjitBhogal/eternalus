import type { DisplayCatalogue } from '../bridge/catalogue.types';
import type { MatchViewport } from './MatchViewport.types';

/** The viewport's labels; `main.tsx` passes `STRINGS.viewport` (labels live in `ui/strings.ts`). */
export type GameCanvasLabels = {
  /** The canvas's accessible name during play. */
  readonly canvas: string;
  /** The interim control that leaves the cathedral interior in normal play (CD-22). */
  readonly leaveCathedral: string;
  /** The developer explorer's labels (`?dev=1`). */
  readonly explorer: {
    readonly canvas: string;
    readonly worldHint: string;
    readonly interiorHint: string;
    readonly overview: string;
    /** `stronghold` words a team's stronghold from its name (`GameCanvasProps.teamNames`). */
    readonly legend: { readonly stronghold: (teamName: string) => string; readonly camps: string };
  };
};

/** What `main.tsx` gives the viewport. */
export type GameCanvasProps = {
  /** `SessionController.attachViewport`; the returned function runs on unmount. */
  readonly attach: (viewport: MatchViewport) => () => void;
  /**
   * Whether the developer explorer's chrome and gestures are on when a match starts (`?dev=1`;
   * DEC-32, INBOX HC-F8); DEC-105's hotkey shows or hides them during the match.
   */
  readonly isExplorerShown: boolean;
  readonly labels: GameCanvasLabels;
  /** Each team's display name (the loaded catalogue's `teamNames`): the explorer legend. */
  readonly teamNames: DisplayCatalogue['teamNames'];
};
