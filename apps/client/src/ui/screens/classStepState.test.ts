import { describe, expect, it } from 'vitest';

import {
  type ClassStepCard,
  cycleClass,
  initialClassStep,
  pickClass,
  previewClass,
  selectPickedIntent,
  selectShownIntent,
  shownClassId,
} from './classStepState';

/** 62:125's row: Legionnaire, Sentinel, Magus, and the locked Harbinger last. */
const CARDS: readonly ClassStepCard[] = [
  { classId: 'warrior', isAvailable: true },
  { classId: 'sentinel', isAvailable: true },
  { classId: 'magus', isAvailable: true },
  { classId: 'flying', isAvailable: false },
];

const NOTHING = { pickedClassId: null, previewClassId: null } as const;

describe('initialClassStep', () => {
  it('picks the available class Back cleared', () => {
    expect(initialClassStep(CARDS, 'magus')).toEqual({
      pickedClassId: 'magus',
      previewClassId: null,
    });
  });

  it('picks nothing on first entry, for a locked class and for an unknown one', () => {
    expect(initialClassStep(CARDS, null)).toEqual(NOTHING);
    expect(initialClassStep(CARDS, 'flying')).toEqual(NOTHING);
    expect(initialClassStep(CARDS, 'druid')).toEqual(NOTHING);
  });
});

describe('pickClass and previewClass', () => {
  it('picks an available class, never a locked or unknown one', () => {
    const picked = pickClass(NOTHING, CARDS, 'sentinel');

    expect(picked.pickedClassId).toBe('sentinel');
    expect(pickClass(picked, CARDS, 'flying')).toBe(picked);
    expect(pickClass(picked, CARDS, 'druid')).toBe(picked);
  });

  it('sets and clears the preview, a locked class included', () => {
    const previewing = previewClass(NOTHING, 'flying');

    expect(previewing.previewClassId).toBe('flying');
    expect(previewClass(previewing, null).previewClassId).toBeNull();
  });
});

describe('shownClassId', () => {
  it('shows the preview, then the pick, then the first available, then the first card', () => {
    const picked = pickClass(NOTHING, CARDS, 'magus');

    expect(shownClassId(previewClass(picked, 'flying'), CARDS)).toBe('flying');
    expect(shownClassId(picked, CARDS)).toBe('magus');
    expect(shownClassId(NOTHING, CARDS)).toBe('warrior');
    expect(shownClassId(NOTHING, [{ classId: 'flying', isAvailable: false }])).toBe('flying');
    expect(shownClassId(NOTHING, [])).toBeNull();
  });
});

describe('cycleClass', () => {
  it('picks the next available class after the shown one, skipping the locked one and wrapping', () => {
    const magus = pickClass(NOTHING, CARDS, 'magus');

    expect(cycleClass(NOTHING, CARDS, 1).pickedClassId).toBe('sentinel');
    expect(cycleClass(magus, CARDS, 1).pickedClassId).toBe('warrior');
    expect(cycleClass(NOTHING, CARDS, -1).pickedClassId).toBe('magus');
  });

  it('starts from the shown class and clears the preview', () => {
    const state = cycleClass(previewClass(NOTHING, 'sentinel'), CARDS, 1);

    expect(state).toEqual({ pickedClassId: 'magus', previewClassId: null });
  });

  it('leaves the state alone when no class is available', () => {
    const locked: readonly ClassStepCard[] = [{ classId: 'flying', isAvailable: false }];

    expect(cycleClass(NOTHING, locked, 1)).toBe(NOTHING);
  });
});

describe('intents', () => {
  it('Select Class asks for exactly the picked class, nothing without a pick', () => {
    expect(selectPickedIntent(pickClass(NOTHING, CARDS, 'magus'))).toEqual({
      kind: 'select-class',
      classId: 'magus',
    });
    expect(selectPickedIntent(NOTHING)).toBeNull();
  });

  it('View Details asks for the shown class, never a locked one', () => {
    expect(selectShownIntent(NOTHING, CARDS)).toEqual({
      kind: 'select-class',
      classId: 'warrior',
    });
    expect(selectShownIntent(previewClass(NOTHING, 'flying'), CARDS)).toBeNull();
    expect(selectShownIntent(NOTHING, [])).toBeNull();
  });
});
