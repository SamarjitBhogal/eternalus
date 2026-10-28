import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { loadedAssetsFor, TEST_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import type { LegendClassCard, LegendSpecCard } from '../../bridge/catalogue.types';
import type { LegendClassId } from '../../bridge/domain.types';
import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { isSelectableSpec } from '../../bridge/selectionRules';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import type { RootState } from '../../bridge/store';
import { assetsWithBoxes, radioGroup, renderWithStore, TEST_CONTENT } from '../testStore';
import { useLegendSelectStep } from './useLegendSelectStep';

type Model = ReturnType<typeof useLegendSelectStep>;

const ASSETS = loadedAssetsFor(TEST_CONTENT);

/** The test catalogue's first class with a Legend that has a row plate; the cases below need one. */
function platedClass(): LegendClassCard {
  const card = TEST_CONTENT.legendClasses.find(({ specs }) =>
    specs.some((spec) => spec.art.rowPlate !== null),
  );
  if (card === undefined) throw new Error('TEST_CONTENT has no Legend with a row plate');
  return card;
}

const CLASS = platedClass();
const LEGENDS = CLASS.specs;

/** `CLASS`'s first Legend that matches `predicate`. */
function legendWhere(predicate: (spec: LegendSpecCard) => boolean): LegendSpecCard {
  const spec = LEGENDS.find(predicate);
  if (spec === undefined) throw new Error(`${CLASS.classId} has no such Legend`);
  return spec;
}

const PLATED = legendWhere((spec) => spec.art.rowPlate !== null);
const UNPLATED = legendWhere((spec) => isSelectableSpec(spec) && spec.art.rowPlate === null);
const PLATE_ID = PLATED.art.rowPlate ?? '';

/** Hands each render's model to `onModel`, so the hook is read through the store like a component. */
function StepProbe({ onModel }: { readonly onModel: (model: Model) => void }): ReactElement {
  const model = useLegendSelectStep();
  onModel(model);
  return <output />;
}

/** The model for `selection` (the player on the Light team), from the last render. */
function modelOf(
  selection: { readonly classId: LegendClassId | null; readonly specId: string | null },
  assets: RootState['assets'] = ASSETS,
): Model {
  let last: Model | undefined;
  renderWithStore(
    <StepProbe
      onModel={(model) => {
        last = model;
      }}
    />,
    {
      assets,
      matchSetup: { ...matchSetupSlice.getInitialState(), playerTeam: 'light', selection },
    },
  );
  if (last === undefined) throw new Error('the probe did not render');
  return last;
}

let stop: () => void = () => undefined;
afterEach(() => {
  stop();
});

describe('useLegendSelectStep', () => {
  it('is null on the class step', () => {
    expect(modelOf({ classId: null, specId: null })).toBeNull();
  });

  it('builds the row plate from the picked Legend and passes LOCK IN its chrome plate (CD-16)', () => {
    const model = modelOf({ classId: CLASS.classId, specId: PLATED.specId });
    const url = ASSETS.urlsByGroup.selection[PLATE_ID];
    const box = TEST_ASSET_BOXES[PLATE_ID];

    expect(url).toBeDefined();
    expect(box).toBeDefined();
    expect(model?.rowPlate).toEqual({ url, box });
    expect(model?.lockInChromeAssetId).toBe(TEST_CONTENT.lockInChromeAssetId);
    expect(model?.tabbableIndex).toBe(LEGENDS.indexOf(PLATED));
  });

  it('passes LOCK IN no chrome plate while no row plate is drawn', () => {
    const noPick = modelOf({ classId: CLASS.classId, specId: null });
    const noPlate = modelOf({ classId: CLASS.classId, specId: UNPLATED.specId });
    const noBox = modelOf(
      { classId: CLASS.classId, specId: PLATED.specId },
      assetsWithBoxes({ [PLATE_ID]: undefined }),
    );

    expect(TEST_CONTENT.lockInChromeAssetId).not.toBeNull();
    for (const model of [noPick, noPlate, noBox]) {
      expect(model).not.toBeNull();
      expect(model?.rowPlate).toBeNull();
      expect(model?.lockInChromeAssetId).toBeNull();
    }
  });

  it('picks the Legend an arrow lands on (one select-class) and moves the focus there', () => {
    const model = modelOf({ classId: CLASS.classId, specId: PLATED.specId });
    const from = LEGENDS.indexOf(PLATED);
    const to = (from + 1) % LEGENDS.length;
    const target = LEGENDS[to];
    const intents: UiIntent[] = [];
    stop = eventBus.on('ui-intent', (intent) => {
      intents.push(intent);
    });
    const arrow = radioGroup(LEGENDS.length);

    model?.onCardKeyDown(arrow.keyOn('ArrowRight'), from);

    expect(target !== undefined && isSelectableSpec(target)).toBe(true);
    expect(intents).toEqual([
      { kind: 'select-class', classId: CLASS.classId, specId: target?.specId },
    ]);
    expect(arrow.focused).toEqual([to]);
    expect(arrow.prevented()).toBe(1);
  });

  it('emits nothing and keeps the focus for any other key', () => {
    const model = modelOf({ classId: CLASS.classId, specId: PLATED.specId });
    const intents: UiIntent[] = [];
    stop = eventBus.on('ui-intent', (intent) => {
      intents.push(intent);
    });
    const tab = radioGroup(LEGENDS.length);

    model?.onCardKeyDown(tab.keyOn('Tab'), LEGENDS.indexOf(PLATED));

    expect(intents).toEqual([]);
    expect(tab.focused).toEqual([]);
    expect(tab.prevented()).toBe(0);
  });
});
