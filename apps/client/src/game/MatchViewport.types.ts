import type { DrawSurface } from './engine/render/Canvas2dRenderer.types';

/**
 * The canvas as `MatchHost`, `CanvasPointerControls` and the match factory use it. An
 * `HTMLCanvasElement` satisfies it; tests use `FakeViewportCanvas`. Only
 * `Canvas2dRenderer.fromCanvas` calls `getContext` (architecture 01 rule 7).
 */
export type ViewportCanvas = EventTarget &
  DrawSurface & {
    width: number;
    height: number;
    readonly clientWidth: number;
    readonly clientHeight: number;
    getBoundingClientRect(): {
      readonly left: number;
      readonly top: number;
      readonly width: number;
      readonly height: number;
    };
    setPointerCapture(pointerId: number): void;
    hasPointerCapture(pointerId: number): boolean;
    releasePointerCapture(pointerId: number): void;
  };

/**
 * How the match's pointer controls talk back to `GameCanvas`'s chrome: the cathedral interior
 * (normal play, DEC-32), the developer explorer's overview and whether the explorer is shown
 * (`?dev=1` at the start, then DEC-105's hotkey; DEC-32, INBOX HC-F8).
 */
export type ViewportChrome = {
  /** The view went inside the cathedral (`true`) or back to the battlefield (`false`). */
  readonly onInteriorChanged: (isInside: boolean) => void;
  /** DEC-105's hotkey showed (`true`) or hid (`false`) the developer explorer. */
  readonly onExplorerChanged: (isShown: boolean) => void;
  /** Gives the Leave cathedral control its action; `null` when the match ends. */
  readonly setLeaveInterior: (run: (() => void) | null) => void;
  /** Gives the developer toolbar's overview button its action; `null` when the match ends. */
  readonly setOverview: (run: (() => void) | null) => void;
};

/** What `GameCanvas` hands the session when its canvas mounts (architecture 13 §1). */
export type MatchViewport = {
  readonly canvas: ViewportCanvas;
  readonly chrome: ViewportChrome;
  /**
   * Whether the developer explorer (drag, wheel, overview) is on when the match starts: `?dev=1`
   * (demo-only by DEC-32; INBOX HC-F8). DEC-105's hotkey shows or hides it afterwards.
   */
  readonly isExplorerShown: boolean;
};
