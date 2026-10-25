import { describe, expect, it } from 'vitest';

import type { AssetId, DisplayCatalogue, RenditionKey } from '../../bridge/catalogue.types';
import type { AssetGroup } from '../../bridge/events';
import { assetBoxes } from '../../data/resources/assetBoxes';
import { ASSET_MANIFEST } from '../../data/resources/AssetManifest';
import { shippedCatalogue } from './__fixtures__/shippedCatalogue';

/**
 * Where a screen draws an asset: the primary class step (62:125), the alternate class step
 * (62:70: no cards, roster or Legends strip), the Legend step (58:271), a plate of the class step
 * or of the Legend step (drawn only on `'figma-raster'`), or the match HUD (62:231).
 */
type Use =
  'class-primary' | 'class-alternate' | 'legend-step' | 'class-plate' | 'legend-plate' | 'hud';

/** Roster tiles (sigils, portraits): the primary class step and the Legend step. */
const ROSTER: readonly Use[] = ['class-primary', 'legend-step'];
/** The backdrop and the banner: every selection frame. */
const EVERY_SELECTION_FRAME: readonly Use[] = ['class-primary', 'class-alternate', 'legend-step'];

/** Every asset id the catalogue names, with the places that draw it. */
function assetUses(catalogue: DisplayCatalogue): ReadonlyMap<AssetId, ReadonlySet<Use>> {
  const uses = new Map<AssetId, Set<Use>>();
  const add = (id: AssetId | null, where: readonly Use[]): void => {
    if (id !== null) uses.set(id, new Set([...(uses.get(id) ?? []), ...where]));
  };
  for (const card of catalogue.legendClasses) {
    add(card.art.card, ['class-primary']);
    add(card.art.sigil, ROSTER);
    add(card.art.model, ['class-alternate']);
    for (const plate of Object.values(card.art.cardPlates)) add(plate, ['class-plate']);
    add(card.art.rowPlate, ['class-plate']);
    for (const row of card.details) add(row.iconAssetId, ['class-primary']);
    const alternateRows = card.layoutOverrides.alternate?.details ?? card.details;
    for (const row of alternateRows) add(row.iconAssetId, ['class-alternate']);
    add(card.hud?.emblemAssetId ?? null, ['hud']);
    add(card.hud?.weapon?.iconAssetId ?? null, ['hud']);
    for (const slot of card.hud?.slots ?? []) add(slot.iconAssetId, ['hud']);
    for (const spec of card.specs) {
      add(spec.art.card, ['legend-step']);
      add(spec.art.refraction, ['legend-step']);
      add(spec.art.portrait, ROSTER);
      add(spec.art.mini, ['class-primary']);
      add(spec.art.rowPlate, ['legend-plate']);
      for (const row of spec.details) add(row.iconAssetId, ['legend-step']);
    }
  }
  for (const set of catalogue.backgroundSets) {
    for (const layer of set.layers)
      if (layer.kind === 'image') add(layer.assetId, EVERY_SELECTION_FRAME);
  }
  add(catalogue.selectionBannerAssetId, EVERY_SELECTION_FRAME);
  add(catalogue.selectClassChromeAssetId, ['class-plate']);
  add(catalogue.lockInChromeAssetId, ['legend-plate']);
  for (const entry of catalogue.hud.structureKinds) add(entry.iconAssetId, ['hud']);
  const { chrome } = catalogue.hud;
  if (chrome !== null) {
    const shields = Object.values(chrome.objectiveShieldAssetIds);
    for (const id of [
      chrome.minimapFrameAssetId,
      chrome.crystalAssetId,
      chrome.allegianceFlagAssetId,
      ...shields,
    ]) {
      add(id, ['hud']);
    }
  }
  return uses;
}

/**
 * The group rule (14 §14): an id only a plate field names is in its step's raster
 * group; an id only the HUD draws is in `match`; an id only one layout's class step draws is in
 * that layout's group; anything else (both layouts, or the Legend step) is in `selection`.
 */
function expectedGroup(uses: ReadonlySet<Use>): AssetGroup {
  const only = (use: Use): boolean => [...uses].every((candidate) => candidate === use);
  const ONLY_GROUPS: readonly (readonly [Use, AssetGroup])[] = [
    ['class-plate', 'selection-primary-raster'],
    ['legend-plate', 'selection-raster'],
    ['hud', 'match'],
    ['class-primary', 'selection-primary'],
    ['class-alternate', 'selection-alternate'],
  ];
  return ONLY_GROUPS.find(([use]) => only(use))?.[1] ?? 'selection';
}

/**
 * The manifest box key of every image the selection screens draw at the slot it was baked for: a
 * class card plate or row plate (its own file, `id`), and each Legend's card art, refraction copy
 * and mini (the rendition each look draws, `id@rendition`). The screens find each box by that key
 * (14 §13: views ask by id), so a missing one would quietly draw the live art instead.
 */
function placedImageKeys(catalogue: DisplayCatalogue): string[] {
  const keys: string[] = [];
  const add = (id: AssetId | null, renditions?: readonly RenditionKey[]): void => {
    if (id === null) return;
    keys.push(...(renditions === undefined ? [id] : renditions.map((key) => `${id}@${key}`)));
  };
  for (const card of catalogue.legendClasses) {
    for (const plate of Object.values(card.art.cardPlates)) add(plate);
    add(card.art.rowPlate);
    for (const spec of card.specs) {
      add(spec.art.card, ['card-idle', 'card-picked']);
      add(spec.art.refraction ?? spec.art.card, ['refraction-idle', 'refraction-picked']);
      add(spec.art.mini, ['legend-mini']);
      add(spec.art.rowPlate);
    }
  }
  return keys;
}

describe('coreCatalogue assets', () => {
  const uses = assetUses(shippedCatalogue().load());
  const groupOf = new Map(ASSET_MANIFEST.assets.map((entry) => [entry.id, entry.group]));

  it('names only manifest assets, each in the group its screens load', () => {
    expect(uses.size).toBeGreaterThan(40);
    const misplaced = [...uses]
      .map(([id, where]) => ({
        id,
        group: groupOf.get(id) ?? null,
        expected: expectedGroup(where),
      }))
      .filter(({ group, expected }) => group !== expected);
    expect(misplaced).toEqual([]);
    expect(groupOf.get('magus-detail-arcane-intellect')).toBe('selection-primary');
    expect(expectedGroup(uses.get('magus-detail-aetheric-recall') ?? new Set())).toBe('selection');
  });

  it('names no asset after a retired title or a Legend name (OA3)', () => {
    const named = [...uses.keys()].filter((id) =>
      /cantor|gravecaller|veridan|elarion|avedrin|nadirev|noirale|nirdeva/.test(id),
    );
    expect(named).toEqual([]);
  });

  it('declares in the manifest the draw box of every image the screens place at its baked slot', () => {
    const boxed = new Set(Object.keys(assetBoxes(ASSET_MANIFEST.assets)));
    const keys = placedImageKeys(shippedCatalogue().load());

    expect(keys).toContain('oracle-refraction-art@refraction-picked');
    expect(keys).toContain('magus-card-plate-picked');
    expect(keys.filter((key) => !boxed.has(key))).toEqual([]);
  });
});
