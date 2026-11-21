import type { LegendClassCard } from '../catalogue.types';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import type { RootState } from '../store';

/** The catalogue card of the picked class (a stored reference); `undefined` before a pick. */
export function selectSelectedClassCard(
  state: Pick<RootState, 'content' | 'matchSetup'>,
): LegendClassCard | undefined {
  const { classId } = matchSetupSlice.selectors.selectSelection(state);
  return contentSlice.selectors.selectLegendClasses(state).find((card) => card.classId === classId);
}
