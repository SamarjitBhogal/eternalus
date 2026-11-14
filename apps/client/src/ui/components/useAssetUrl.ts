import type { AssetId, RenditionKey } from '../../bridge/catalogue.types';
import { useAppSelector } from '../../bridge/hooks';
import { assetsSlice } from '../../bridge/slices/assetsSlice';

/**
 * The URL of `assetId` (its `rendition`'s own file when the manifest has one) once its group has
 * loaded; `null` before, and for a `null` id, so the caller draws its placeholder.
 */
export function useAssetUrl(assetId: AssetId | null, rendition?: RenditionKey): string | null {
  return useAppSelector((state) => assetsSlice.selectors.selectAssetUrl(state, assetId, rendition));
}
