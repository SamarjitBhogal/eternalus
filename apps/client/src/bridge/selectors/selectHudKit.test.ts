import { describe, expect, it } from 'vitest';

import type { ClassHudDisplay, DisplayCatalogue } from '../catalogue.types';
import { classCardFixture } from '../__fixtures__/catalogueFixtures';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { selectHudKit } from './selectHudKit';

const WARRIOR_KIT: ClassHudDisplay = {
  emblemAssetId: 'warrior-hud-emblem',
  weapon: { displayName: null, iconAssetId: 'warrior-weapon-battle-axe' },
  slots: [],
};

const CLASSES = [
  classCardFixture({ classId: 'warrior', hud: WARRIOR_KIT }),
  classCardFixture({ classId: 'flying', status: 'locked' }),
];

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

describe('selectHudKit', () => {
  it('is the picked class kit, the stored reference', () => {
    expect(selectHudKit(stateWith('warrior'))).toBe(WARRIOR_KIT);
  });

  it('is null without a pick and for the locked class, which has no kit', () => {
    expect(selectHudKit(stateWith(null))).toBeNull();
    expect(selectHudKit(stateWith('flying'))).toBeNull();
  });
});
