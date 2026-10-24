import { useState } from 'react';

import type { LegendClassId } from '../../bridge/domain.types';

/**
 * The class the character-select shell remembers for Back (CD-11): the session's selected class
 * while there is one, else the last one remembered. So a pick is remembered, Back (`null`) keeps
 * it, and a new pick replaces it; the shell passes it to the class step as `preferredClassId`.
 */
export function rememberedClassId(
  last: LegendClassId | null,
  current: LegendClassId | null,
): LegendClassId | null {
  return current ?? last;
}

/**
 * The shell's Back memory over renders: `rememberedClassId` of the last value and the session's
 * `classId`, kept in state (updated during render, so the step that mounts on Back gets it at once).
 */
export function useRememberedClassId(classId: LegendClassId | null): LegendClassId | null {
  const [lastClassId, setLastClassId] = useState<LegendClassId | null>(classId);
  const remembered = rememberedClassId(lastClassId, classId);
  if (remembered !== lastClassId) setLastClassId(remembered);
  return remembered;
}
