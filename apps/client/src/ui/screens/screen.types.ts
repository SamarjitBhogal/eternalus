import type { ReactNode } from 'react';

/** Props `App` passes to every screen. */
export type ScreenProps = {
  /**
   * The game canvas host, built in `main.tsx` (ui/ may not import game/). Only `MatchScreen`
   * renders it (13 §3); every other screen ignores it.
   */
  readonly viewport?: ReactNode;
};
