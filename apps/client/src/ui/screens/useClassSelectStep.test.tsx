import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { loadedAssetsFor, TEST_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { LegendClassId } from '../../bridge/domain.types';
import { isSelectableClass } from '../../bridge/selectionRules';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import type { RootState } from '../../bridge/store';
import { assetsWithBoxes, keyOnRadioCards, renderWithStore, TEST_CONTENT } from '../testStore';
import { useClassSelectStep } from './useClassSelectStep';

type Model = ReturnType<typeof useClassSelectStep>;

const CARDS = TEST_CONTENT.legendClasses;
const ASSETS = loadedAssetsFor(TEST_CONTENT);

/** The test catalogue's first class that matches `predicate`; the cases below need one. */
function classWhere(predicate: (card: LegendClassCard) => boolean): LegendClassCard {
  const card = CARDS.find(predicate);
  if (card === undefined) throw new Error('TEST_CONTENT has no such class');
  return card;
}

const PLATED = classWhere((card) => isSelectableClass(card) && card.art.rowPlate !== null);
const UNPLATED = classWhere((card) => isSelectableClass(card) && card.art.rowPlate === null);
const LOCKED = classWhere((card) => !isSelectableClass(card));
const PLATE_ID = PLATED.art.rowPlate ?? '';

/** Hands each render's model to `onModel`, so the hook is read through the store like a component. */
function StepProbe({
  preferredClassId,
  onModel,
}: {
  readonly preferredClassId: LegendClassId | null;
  readonly onModel: (model: Model) => void;
}): ReactElement {
  const model = useClassSelectStep(preferredClassId);
  onModel(model);
  return <output />;
}

/**
 * The model of the last render. A server render runs no effect or event, but a state update made
 * while the probe renders re-renders it at once, so `press` (run once, in the first render) can
 * drive the hook's own state as a key press would.
 */
function modelOf(
  preferredClassId: LegendClassId | null,
  {
    assets = ASSETS,
    press,
  }: { readonly assets?: RootState['assets']; readonly press?: (model: Model) => void } = {},
): Model {
  let last: Model | undefined;
  let isPressed = false;
  renderWithStore(
    <StepProbe
      preferredClassId={preferredClassId}
      onModel={(model) => {
        last = model;
        if (press === undefined || isPressed) return;
        isPressed = true;
        press(model);
      }}
    />,
    { assets },
  );
  if (last === undefined) throw new Error('the probe did not render');
  return last;
}

/** A key press on a card among the class cards, recording which card takes the focus. */
const keyOnCards = (key: string) => keyOnRadioCards(CARDS.length, key);

describe('useClassSelectStep', () => {
  it('picks the preferred class (Back) and puts the tab stop on it', () => {
    const model = modelOf(PLATED.classId);

    expect(model.local.pickedClassId).toBe(PLATED.classId);
    expect(model.picked?.classId).toBe(PLATED.classId);
    expect(model.tabbableIndex).toBe(CARDS.indexOf(PLATED));
  });

  it('picks nothing without a preference or for a locked one; the tab stop is the first available', () => {
    for (const preferred of [null, LOCKED.classId]) {
      const model = modelOf(preferred);

      expect(model.picked).toBeUndefined();
      expect(model.tabbableIndex).toBe(CARDS.findIndex(isSelectableClass));
    }
  });

  it('builds the row plate from the picked card, at its loaded URL and box (CD-16)', () => {
    const url = ASSETS.urlsByGroup.selection[PLATE_ID];
    const box = TEST_ASSET_BOXES[PLATE_ID];

    expect(url).toBeDefined();
    expect(box).toBeDefined();
    expect(modelOf(PLATED.classId).rowPlate).toEqual({ url, box });
  });

  it('draws no row plate without a pick, for a pick without one, or before its URL or box is known', () => {
    expect(modelOf(null).rowPlate).toBeNull();
    expect(modelOf(UNPLATED.classId).rowPlate).toBeNull();
    expect(
      modelOf(PLATED.classId, { assets: assetsWithBoxes({ [PLATE_ID]: undefined }) }).rowPlate,
    ).toBeNull();
    expect(modelOf(PLATED.classId, { assets: assetsSlice.getInitialState() }).rowPlate).toBeNull();
  });

  it('moves the focus along the cards with an arrow, and leaves any other key alone', () => {
    const model = modelOf(null);
    const arrow = keyOnCards('ArrowLeft');
    const tab = keyOnCards('Tab');

    model.onCardKeyDown(arrow.event, 0);
    model.onCardKeyDown(tab.event, 0);

    expect(arrow.focused).toEqual([CARDS.length - 1]);
    expect(arrow.prevented()).toBe(1);
    expect(tab.focused).toEqual([]);
    expect(tab.prevented()).toBe(0);
  });

  it('picks the available class an arrow lands on, and its row plate follows', () => {
    const from = (CARDS.indexOf(PLATED) + 1) % CARDS.length;
    const model = modelOf(null, {
      press: (first) => {
        first.onCardKeyDown(keyOnCards('ArrowLeft').event, from);
      },
    });

    expect(model.local.pickedClassId).toBe(PLATED.classId);
    expect(model.rowPlate).not.toBeNull();
  });
});
