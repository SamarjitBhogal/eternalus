/**
 * Test support: an assets state with every asset a catalogue names loaded, for `ui/testStore.tsx`.
 * Imported only by test support, never by a module `main.tsx` reaches (I-76).
 */
import type { AssetId, DisplayCatalogue, RenditionKey } from './catalogue.types';
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
 * every rendition key. No credits.
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
  };
}
