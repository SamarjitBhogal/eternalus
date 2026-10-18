import { describe, expect, it } from 'vitest';

import { classCardFixture } from '../catalogueFixtures';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { createAppStore } from '../store';
import { selectSelectableClasses } from './selectSelectableClasses';

describe('selectSelectableClasses', () => {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      legendClasses: [
        classCardFixture({ classId: 'warrior' }),
        classCardFixture({ classId: 'flying', status: 'locked' }),
        classCardFixture({ classId: 'magus' }),
      ],
    }),
  );

  it('lists the available classes in catalogue order, leaving locked ones out', () => {
    expect(selectSelectableClasses(store.getState()).map((card) => card.classId)).toEqual([
      'warrior',
      'magus',
    ]);
  });

  it('returns the same array after an unrelated dispatch', () => {
    const before = selectSelectableClasses(store.getState());
    store.dispatch(matchSetupSlice.actions.setCountdown(41_000));
    expect(selectSelectableClasses(store.getState())).toBe(before);
  });
});
