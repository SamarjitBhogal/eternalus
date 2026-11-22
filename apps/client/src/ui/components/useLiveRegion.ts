import { createContext, useContext } from 'react';

/** The element of the app's polite live region (`LiveRegion`), `null` until it mounts. */
export const LiveRegionContext = createContext<HTMLElement | null>(null);

/**
 * The app's one polite live region, for a component that says a line to a screen reader by
 * portalling the line into it: `null` before the region mounts, in a server render and outside
 * `LiveRegion`, where the line is simply not said.
 */
export function useLiveRegion(): HTMLElement | null {
  return useContext(LiveRegionContext);
}
