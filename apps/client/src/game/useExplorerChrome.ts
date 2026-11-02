import { useCallback, useMemo, useRef, useState } from 'react';

import type { ViewportChrome } from './MatchViewport.types';

/**
 * The viewport chrome's state for `GameCanvas`: whether a building roof is cut away, whether the
 * developer explorer is shown (`isExplorerShownAtStart`, then as DEC-105's hotkey toggles it in
 * the running match), and the overview action the running match hands it. `chrome` keeps one
 * identity, so the attach effect re-runs only when StrictMode re-runs it.
 */
export function useExplorerChrome(isExplorerShownAtStart: boolean): {
  readonly chrome: ViewportChrome;
  readonly hasOpenRoofs: boolean;
  readonly isExplorerShown: boolean;
  readonly overview: () => void;
} {
  const [hasOpenRoofs, setHasOpenRoofs] = useState(false);
  const [isExplorerShown, setIsExplorerShown] = useState(isExplorerShownAtStart);
  const overviewRef = useRef<(() => void) | null>(null);
  const chrome = useMemo<ViewportChrome>(
    () => ({
      onRoofsChanged: setHasOpenRoofs,
      onExplorerChanged: setIsExplorerShown,
      setOverview: (run) => {
        overviewRef.current = run;
      },
    }),
    [],
  );
  const overview = useCallback(() => {
    overviewRef.current?.();
  }, []);
  return { chrome, hasOpenRoofs, isExplorerShown, overview };
}
