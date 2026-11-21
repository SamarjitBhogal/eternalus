import type { ReactElement } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import { AssetImage } from './AssetImage';
import styles from './SelectionBanner.module.css';

/**
 * The skull banner across the top of both selection steps (62:143 / 58:289): the banner art drawn
 * 1:1 at its placement box and the screen's `<h1>` over it. Before the art loads only the title
 * shows; with no art in the catalogue the title stands alone.
 */
export function SelectionBanner({
  title,
  bannerAssetId,
}: {
  readonly title: string;
  readonly bannerAssetId: AssetId | null;
}): ReactElement {
  return (
    <div className={styles.banner}>
      <AssetImage assetId={bannerAssetId} className={styles.image} />
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
}
