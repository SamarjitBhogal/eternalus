import { describe, expect, it } from 'vitest';

import { classCardFixture, specCardFixture } from './__fixtures__/catalogueFixtures';
import { canConfirmSelection, isSelectableClass, isSelectableSpec } from './selectionRules';

const warrior = classCardFixture({ classId: 'warrior' });
const magus = classCardFixture({
  classId: 'magus',
  specs: [
    specCardFixture({ specId: 'catalyst' }),
    specCardFixture({ specId: 'oracle' }),
    specCardFixture({ specId: 'lost', status: 'locked' }),
  ],
});
const harbinger = classCardFixture({ classId: 'harbinger', status: 'locked' });

describe('selectionRules', () => {
  it('confirms an available class without Legends once it is the selection', () => {
    expect(canConfirmSelection(warrior, { classId: 'warrior', specId: null })).toBe(true);
  });

  it('needs one of the class’s available Legends picked when it offers any', () => {
    expect(canConfirmSelection(magus, { classId: 'magus', specId: null })).toBe(false);
    expect(canConfirmSelection(magus, { classId: 'magus', specId: 'oracle' })).toBe(true);
    expect(canConfirmSelection(magus, { classId: 'magus', specId: 'knight' })).toBe(false);
    expect(canConfirmSelection(magus, { classId: 'magus', specId: 'lost' })).toBe(false);
  });

  it('never confirms a locked class or a selection for another class', () => {
    expect(canConfirmSelection(harbinger, { classId: 'harbinger', specId: null })).toBe(false);
    expect(canConfirmSelection(warrior, { classId: 'magus', specId: null })).toBe(false);
  });

  it('treats only available classes and Legends as selectable', () => {
    expect([isSelectableClass(warrior), isSelectableClass(harbinger)]).toEqual([true, false]);
    expect(isSelectableSpec(specCardFixture({ specId: 'lost', status: 'locked' }))).toBe(false);
    expect(isSelectableSpec(specCardFixture({ specId: 'oracle' }))).toBe(true);
  });
});
