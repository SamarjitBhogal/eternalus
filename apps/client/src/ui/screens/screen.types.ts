import type { ReactNode } from 'react';

/** Props `App` passes to every screen. Only the match screen renders the viewport. */
export type ScreenProps = {
  /** The game canvas host, built in `main.tsx` (ui/ may not import game/). */
  readonly viewport?: ReactNode;
};
