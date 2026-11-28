import type { ReactElement } from 'react';

import type { AssetId, RenditionKey } from '../../bridge/catalogue.types';
import { useAssetUrl } from './useAssetUrl';

/**
 * A manifest image (`<img>` at its own pixel size; the caller's class places it): nothing until its
 * URL is in the store, so the caller's placeholder shows meanwhile. `rendition` picks the file made
 * for that use (I-45). Without `alt` the image is decorative (`alt=""`, hidden from assistive
 * technology).
 */
export function AssetImage({
  assetId,
  rendition,
  className,
  alt = '',
}: {
  readonly assetId: AssetId | null;
  readonly rendition?: RenditionKey;
  /** A CSS module class (`string | undefined` under `noUncheckedIndexedAccess`); none when undefined. */
  readonly className?: string | undefined;
  readonly alt?: string;
}): ReactElement | null {
  const url = useAssetUrl(assetId, rendition);
  if (url === null) {
    return null;
  }
  return (
    <img
      src={url}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      className={className}
      decoding="async"
      draggable={false}
    />
  );
}
