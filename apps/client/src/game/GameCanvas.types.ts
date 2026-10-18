import type { MatchViewport } from './MatchViewport.types';

/** The viewport's labels; `main.tsx` passes `STRINGS.viewport` (labels live in `ui/strings.ts`). */
export type GameCanvasLabels = {
  /** The canvas's accessible name during play. */
  readonly canvas: string;
  /** The interim control that leaves the cathedral interior in normal play (I-75). */
  readonly leaveCathedral: string;
  /** The developer explorer's labels (`?dev=1`). */
  readonly explorer: {
    readonly canvas: string;
    readonly worldHint: string;
    readonly interiorHint: string;
    readonly overview: string;
    readonly legend: { readonly light: string; readonly dark: string; readonly camps: string };
  };
};

/** What `main.tsx` gives the viewport. */
export type GameCanvasProps = {
  /** `SessionController.attachViewport`; the returned function runs on unmount. */
  readonly attach: (viewport: MatchViewport) => () => void;
  /** Whether the developer explorer's chrome and gestures are on (`?dev=1`, I-55). */
  readonly isExplorerShown: boolean;
  readonly labels: GameCanvasLabels;
};
