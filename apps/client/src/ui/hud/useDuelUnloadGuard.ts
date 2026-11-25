import { useEffect } from 'react';

import { DuelUnloadGuard } from './DuelUnloadGuard';

/** While `isDuel`, the browser confirms before the tab closes or reloads (`DuelUnloadGuard`). */
export function useDuelUnloadGuard(isDuel: boolean): void {
  useEffect(() => {
    if (!isDuel) return undefined;
    const guard = new DuelUnloadGuard(window);
    guard.arm();
    return () => {
      guard.disarm();
    };
  }, [isDuel]);
}
