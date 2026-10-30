import { describe, expect, it } from 'vitest';

import type { HudSlotId } from '../../bridge/Binding.types';
import { TEST_HUD_CATALOGUE } from '../../bridge/__fixtures__/hudFixtures';
import { isSelectableClass } from '../../bridge/selectionRules';
import { ASSET_MANIFEST } from '../../data/resources/AssetManifest';
import { shippedCatalogue } from './__fixtures__/shippedCatalogue';
import { HUD_PRESENTATION } from './hudPresentation';

const SLOT_ORDER: readonly HudSlotId[] = [
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
];
const MATCH_IDS = new Set(
  ASSET_MANIFEST.assets.filter((entry) => entry.group === 'match').map((entry) => entry.id),
);

describe('HUD presentation', () => {
  const catalogue = shippedCatalogue().load();

  it('gives every available class a kit listing the six slots once, in order, and the locked class none', () => {
    const available = catalogue.legendClasses.filter(isSelectableClass);
    expect(available.map((card) => card.classId)).toEqual(['warrior', 'sentinel', 'magus']);
    for (const card of available) {
      expect(card.hud?.slots.map((slot) => slot.slot)).toEqual(SLOT_ORDER);
    }
    expect(catalogue.legendClasses.find((card) => card.classId === 'harbinger')?.hud).toBeNull();
  });

  it('shows every class an empty kit in a live match, and the Vanguard its helmet (DEC-101)', () => {
    const available = catalogue.legendClasses.filter(isSelectableClass);
    for (const card of available) {
      expect(card.hud?.weapon).toBeNull();
      expect(card.hud?.slots.map((slot) => [slot.displayName, slot.iconAssetId])).toEqual(
        SLOT_ORDER.map(() => [null, null]),
      );
    }
    expect(available.map((card) => [card.classId, card.hud?.emblemAssetId])).toEqual([
      ['warrior', 'warrior-hud-emblem'],
      ['sentinel', null],
      ['magus', null],
    ]);
  });

  it('names only match-group assets', () => {
    const kitIds = catalogue.legendClasses.flatMap((card) =>
      card.hud === null
        ? []
        : [
            card.hud.emblemAssetId,
            card.hud.weapon?.iconAssetId ?? null,
            ...card.hud.slots.map((slot) => slot.iconAssetId),
          ],
    );
    const { chrome } = HUD_PRESENTATION;
    const ids = [
      ...kitIds.filter((id) => id !== null),
      ...HUD_PRESENTATION.structureKinds.map((entry) => entry.iconAssetId),
      chrome.minimapFrameAssetId,
      chrome.crystalAssetId,
      chrome.allegianceFlagAssetId,
      ...Object.values(chrome.objectiveShieldAssetIds),
    ];
    // The helmet, five structure icons and six chrome images (the kits are empty, DEC-101).
    expect(ids).toHaveLength(12);
    expect(ids.filter((id) => !MATCH_IDS.has(id))).toEqual([]);
  });

  it('keeps the bridge test fixture equal to the shipped HUD catalogue (I-74 drift check)', () => {
    const shape = (entries: typeof TEST_HUD_CATALOGUE.structureKinds) =>
      entries.map(({ kind, tileGroup, iconAssetId, order, isAggregated }) => ({
        kind,
        tileGroup,
        iconAssetId,
        order,
        isAggregated,
      }));
    expect(shape(TEST_HUD_CATALOGUE.structureKinds)).toEqual(
      shape(HUD_PRESENTATION.structureKinds.map((entry) => ({ ...entry, displayName: '' }))),
    );
    expect(TEST_HUD_CATALOGUE).toEqual(catalogue.hud);
  });
});
