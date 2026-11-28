import type { ReactElement } from 'react';

import type { BackgroundLayer } from '../../bridge/catalogue.types';
import styles from './ImageLayer.module.css';
import { useAssetUrl } from './useAssetUrl';

/** A manifest image, full-bleed (cover), drawn once its group has loaded (AS-3: no raw URLs in content). */
export function ImageLayer({
  layer,
}: {
  readonly layer: Extract<BackgroundLayer, { kind: 'image' }>;
}): ReactElement {
  const url = useAssetUrl(layer.assetId);
  return (
    <div
      className={styles.image}
      style={url === null ? undefined : { backgroundImage: `url("${url}")` }}
    />
  );
}
