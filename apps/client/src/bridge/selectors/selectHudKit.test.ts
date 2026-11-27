import { describe, expect, it } from 'vitest';

import type { ClassHudDisplay } from '../catalogue.types';
import {
  classCardFixture,
  pickedClassState,
  specCardFixture,
} from '../__fixtures__/catalogueFixtures';
import { selectHudKit } from './selectHudKit';

const WARRIOR_KIT: ClassHudDisplay = { emblemAssetId: 'warrior-hud-emblem', slots: [] };

const CLASSES = [
  classCardFixture({
    classId: 'warrior',
    hud: WARRIOR_KIT,
    specs: [specCardFixture({ specId: 'knight' }), specCardFixture({ specId: 'juggernaut' })],
  }),
  classCardFixture({ classId: 'harbinger', status: 'locked' }),
];

const stateWith = (classId: string | null, specId: string | null = null) =>
  pickedClassState(CLASSES, classId, specId);

describe('selectHudKit', () => {
  it('is the picked class kit, the stored reference, whichever Legend is picked', () => {
    expect(selectHudKit(stateWith('warrior'))).toBe(WARRIOR_KIT);
    expect(selectHudKit(stateWith('warrior', 'juggernaut'))).toBe(WARRIOR_KIT);
  });

  it('is null without a pick and for the locked class, which has no kit', () => {
    expect(selectHudKit(stateWith(null))).toBeNull();
    expect(selectHudKit(stateWith('harbinger'))).toBeNull();
  });
});
