import type { AssetId, RasterBox, RenditionKey } from '../../bridge/catalogue.types';
import { shallowEqual, useAppSelector } from '../../bridge/hooks';
import { assetsSlice } from '../../bridge/slices/assetsSlice';

/** One image whose draw box a list asks for: an asset, or one of its renditions. */
type BoxedImage = {
  readonly assetId: AssetId | null;
  readonly rendition?: RenditionKey | undefined;
};

/**
 * The draw boxes of `images`, in order, once their groups have loaded: where the manifest says
 * each file is drawn (14 §13: views ask by id). `null` for no art, a file without a box, or a
 * group not loaded yet. One store read for the whole list, so a list needs no hook per item.
 */
export function useAssetBoxes(images: readonly BoxedImage[]): readonly (RasterBox | null)[] {
  return useAppSelector(
    (state) =>
      images.map(({ assetId, rendition }) =>
        assetsSlice.selectors.selectAssetBox(state, assetId, rendition),
      ),
    shallowEqual,
  );
}

/** `useAssetBoxes` for one image: the draw box of `assetId` (its `rendition`'s own), or `null`. */
export function useAssetBox(assetId: AssetId | null, rendition?: RenditionKey): RasterBox | null {
  return useAssetBoxes([{ assetId, rendition }])[0] ?? null;
}
