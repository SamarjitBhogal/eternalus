/**
 * Test support: an assets state with every asset a catalogue names loaded, for `ui/testStore.tsx`.
 * Imported only by test support, never by a module `main.tsx` reaches (I-76).
 */
import type { AssetId, DisplayCatalogue, RasterBox, RenditionKey } from './catalogue.types';
import { assetsSlice } from './slices/assetsSlice';
import type { RootState } from './store';

const isAssetId = (id: AssetId | null): id is AssetId => id !== null;

/** Every asset id the selection screens of `catalogue` name (art, details, plates, backdrop, chrome). */
function selectionAssetIds(catalogue: DisplayCatalogue): AssetId[] {
  return [
    catalogue.selectionBannerAssetId,
    catalogue.selectClassChromeAssetId,
    catalogue.lockInChromeAssetId,
    ...catalogue.backgroundSets.flatMap((set) =>
      set.layers.flatMap((layer) => (layer.kind === 'image' ? [layer.assetId] : [])),
    ),
    ...catalogue.legendClasses.flatMap(({ art, details, layoutOverrides, specs }) => [
      art.card,
      art.sigil,
      art.model,
      art.rowPlate,
      ...Object.values(art.cardPlates),
      ...[...details, ...Object.values(layoutOverrides).flatMap((o) => o.details ?? [])].map(
        (row) => row.iconAssetId,
      ),
      ...specs.flatMap((spec) => [
        ...Object.values(spec.art),
        ...spec.details.map((row) => row.iconAssetId),
      ]),
    ]),
  ].filter(isAssetId);
}

/** Every asset id the HUD of `catalogue` names (structure icons, chrome, class kits). */
function hudAssetIds(catalogue: DisplayCatalogue): AssetId[] {
  const { structureKinds, chrome } = catalogue.hud;
  return [
    ...structureKinds.map((kind) => kind.iconAssetId),
    ...(chrome === null
      ? []
      : [
          chrome.minimapFrameAssetId,
          chrome.crystalAssetId,
          chrome.allegianceFlagAssetId,
          ...Object.values(chrome.objectiveShieldAssetIds),
        ]),
    ...catalogue.legendClasses.flatMap(({ hud }) =>
      hud === null
        ? []
        : [
            hud.emblemAssetId,
            hud.weapon?.iconAssetId ?? null,
            ...hud.slots.map((s) => s.iconAssetId),
          ],
    ),
  ].filter(isAssetId);
}

/** Every rendition key; a missing key is a compile error. */
const RENDITIONS: Readonly<Record<RenditionKey, true>> = {
  'ally-tile': true,
  'player-tile': true,
  'player-tile-picked': true,
  'legend-mini': true,
  'detail-class': true,
  'detail-class-alt': true,
  'detail-legend': true,
  'card-idle': true,
  'card-picked': true,
  'refraction-idle': true,
  'refraction-picked': true,
  mirrored: true,
};

/**
 * The manifest's draw boxes of the placed images the UI tests' catalogue names (Figma 58:271 and
 * 62:125), keyed like `asset-urls`. bridge/ never imports data/, so they are restated here;
 * `game/content/assetVocabulary.test.ts` proves each equals its manifest box.
 */
export const TEST_ASSET_BOXES: Readonly<Record<string, RasterBox>> = {
  'catalyst-card-art@card-idle': { left: 505, top: 255, width: 266, height: 568 },
  'catalyst-card-art@card-picked': { left: 482, top: 210, width: 314, height: 660 },
  'catalyst-card-art@refraction-idle': { left: 485, top: 226, width: 305, height: 620 },
  'catalyst-card-art@refraction-picked': { left: 457, top: 181, width: 355, height: 699 },
  'oracle-card-art@card-idle': { left: 826, top: 255, width: 266, height: 568 },
  'oracle-card-art@card-picked': { left: 803, top: 210, width: 315, height: 660 },
  'oracle-refraction-art@refraction-idle': { left: 806, top: 226, width: 305, height: 620 },
  'oracle-refraction-art@refraction-picked': { left: 778, top: 181, width: 355, height: 699 },
  'necromancer-card-art@card-idle': { left: 1149, top: 256, width: 265, height: 567 },
  'necromancer-card-art@card-picked': { left: 1125, top: 210, width: 315, height: 660 },
  'necromancer-card-art@refraction-idle': { left: 1127, top: 227, width: 306, height: 619 },
  'necromancer-card-art@refraction-picked': { left: 1101, top: 181, width: 355, height: 699 },
  'catalyst-mini@legend-mini': { left: 70, top: 803, width: 102, height: 137 },
  'oracle-mini@legend-mini': { left: 208, top: 804, width: 100, height: 135 },
  'necromancer-mini@legend-mini': { left: 341, top: 803, width: 102, height: 137 },
  'warrior-card-plate-idle': { left: 524, top: 277, width: 246, height: 525 },
  'sentinel-card-plate-idle': { left: 825, top: 277, width: 246, height: 525 },
  'magus-card-plate-picked': { left: 1111, top: 243, width: 277, height: 592 },
  'flying-card-plate-idle': { left: 1427, top: 277, width: 246, height: 525 },
  'class-row-plate-magus': { left: 491, top: 198, width: 1216, height: 683 },
  'oracle-row-plate': { left: 459, top: 65, width: 1002, height: 936 },
};

/** `/assets/test/<id>.webp` for each id, and `/assets/test/<id>@<rendition>.webp` for every rendition. */
function testUrls(ids: readonly AssetId[]): Readonly<Record<string, string>> {
  return Object.fromEntries(
    ids.flatMap((id): (readonly [string, string])[] => [
      [id, `/assets/test/${id}.webp`],
      ...Object.keys(RENDITIONS).map(
        (key) => [`${id}@${key}`, `/assets/test/${id}@${key}.webp`] as const,
      ),
    ]),
  );
}

/**
 * The assets state with every asset `catalogue` names loaded: selection art in `selection`, HUD
 * art in `match`, each under `/assets/test/<id>.webp` plus `/assets/test/<id>@<rendition>.webp` for
 * every rendition key, and `TEST_ASSET_BOXES` in `selection`. No credits.
 */
export function loadedAssetsFor(catalogue: DisplayCatalogue): RootState['assets'] {
  const initial = assetsSlice.getInitialState();
  return {
    ...initial,
    urlsByGroup: {
      ...initial.urlsByGroup,
      selection: testUrls(selectionAssetIds(catalogue)),
      match: testUrls(hudAssetIds(catalogue)),
    },
    boxesByGroup: { ...initial.boxesByGroup, selection: TEST_ASSET_BOXES },
  };
}
