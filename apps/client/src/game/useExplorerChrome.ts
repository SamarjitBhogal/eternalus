import { useCallback, useMemo, useRef, useState } from 'react';

import type { ViewportChrome } from './MatchViewport.types';

/**
 * The viewport chrome's state for `GameCanvas`: whether the view is inside the cathedral, whether
 * the developer explorer is shown (`isExplorerShownAtStart`, then as DEC-105's hotkey toggles it in
 * the running match), and the leave and overview actions the running match hands it. `chrome`
 * keeps one identity, so the attach effect re-runs only when StrictMode re-runs it.
 */
export function useExplorerChrome(isExplorerShownAtStart: boolean): {
  readonly chrome: ViewportChrome;
  readonly isInterior: boolean;
  readonly isExplorerShown: boolean;
  readonly overview: () => void;
  readonly leaveInterior: () => void;
} {
  const [isInterior, setIsInterior] = useState(false);
  const [isExplorerShown, setIsExplorerShown] = useState(isExplorerShownAtStart);
  const overviewRef = useRef<(() => void) | null>(null);
  const leaveRef = useRef<(() => void) | null>(null);
  const chrome = useMemo<ViewportChrome>(
    () => ({
      onInteriorChanged: setIsInterior,
      onExplorerChanged: setIsExplorerShown,
      setLeaveInterior: (run) => {
        leaveRef.current = run;
      },
      setOverview: (run) => {
        overviewRef.current = run;
      },
    }),
    [],
  );
  const overview = useCallback(() => {
    overviewRef.current?.();
  }, []);
  const leaveInterior = useCallback(() => {
    leaveRef.current?.();
  }, []);
  return { chrome, isInterior, isExplorerShown, overview, leaveInterior };
}
