import { describe, expect, it } from 'vitest';

import { classCardFixture } from '../catalogueFixtures';
import type { DisplayCatalogue } from '../catalogue.types';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { selectSelectedClassCard } from './selectSelectedClassCard';

const CLASSES = [classCardFixture({ classId: 'warrior' }), classCardFixture({ classId: 'magus' })];

const stateWith = (classId: string | null) => ({
  content: contentSlice.reducer(
    undefined,
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      legendClasses: CLASSES,
    } satisfies DisplayCatalogue),
  ),
  matchSetup: matchSetupSlice.reducer(
    undefined,
    matchSetupSlice.actions.select(classId === null ? null : { classId, specId: null }),
  ),
});

describe('selectSelectedClassCard', () => {
  it('finds the catalogue card of the picked class, the same one after a countdown tick', () => {
    const state = stateWith('magus');
    expect(selectSelectedClassCard(state)).toBe(CLASSES[1]);
    const ticked = {
      ...state,
      matchSetup: matchSetupSlice.reducer(
        state.matchSetup,
        matchSetupSlice.actions.setCountdown(41_000),
      ),
    };
    expect(selectSelectedClassCard(ticked)).toBe(CLASSES[1]);
  });

  it('has no card before a pick or for a class the catalogue lacks', () => {
    expect(selectSelectedClassCard(stateWith(null))).toBeUndefined();
    expect(selectSelectedClassCard(stateWith('flying'))).toBeUndefined();
  });
});
