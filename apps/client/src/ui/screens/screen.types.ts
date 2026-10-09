import type { ReactNode } from 'react';

/**
 * Props `App` passes to every screen. Screens that host the game render the viewport: the match
 * screen, and `PlaceholderScreen` in every phase it still stands in for.
 */
export type ScreenProps = {
  /** The game canvas host, built in `main.tsx` (ui/ may not import game/). */
  readonly viewport?: ReactNode;
};
