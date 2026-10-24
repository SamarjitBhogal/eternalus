import type { ReactElement } from 'react';

import type { RenditionKey } from '../../bridge/catalogue.types';
import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { ArchCard, type ArchLayerKind } from '../components/ArchCard';
import styles from './LegendSelectCardHalo.module.css';
import {
  legendArtBox,
  legendCardStyle,
  legendSlot,
  offset,
  originRemainder,
} from './legendSelectLayout';
import type { FramePoint, LegendCardLook } from './legendSelectLayout.types';

/** Where each copy's art sits in it: 61:8 (12.88, 16.93) in 61:4, 61:20 (5.19, 5.91) in 61:17. */
const ART_INSETS: Readonly<Record<LegendCardLook, FramePoint>> = {
  idle: { x: 5.19, y: 5.91 },
  picked: { x: 12.88, y: 16.93 },
};

/** The refraction-copy rendition of each look (OD-2). */
const COPY_RENDITIONS: Readonly<Record<LegendCardLook, RenditionKey>> = {
  idle: 'refraction-idle',
  picked: 'refraction-picked',
};

/**
 * The copy layers, bottom to top: picked = 61:4 (plate 61:5, inner frame 61:6, Rectangle 32
 * 61:7, art 61:8 and its stroke); idle = 61:17 (outer 61:18, inner 61:19, art 61:20).
 */
const COPY_LAYERS: Readonly<Record<LegendCardLook, readonly ArchLayerKind[]>> = {
  picked: ['shadow-plate', 'inner-outline', 'text-scrim', 'art', 'outer-outline'],
  idle: ['outer-outline', 'inner-outline', 'art'],
};

/**
 * One GLASS pane per copy: the frost only (CD-15). A crisp light rim on the pane drew sharp arch
 * lines the Figma's halo does not show (measured on the `'css'` path), so none is drawn.
 */
const PANE_LAYERS: readonly ArchLayerKind[] = ['glass'];

const lookOf = (legend: LegendCardView): LegendCardLook => (legend.isPicked ? 'picked' : 'idle');

/**
 * The live halo of the Legend row (61:3, CD-15): a larger copy of every card behind the crisp
 * row, at the group's opacity 0.6 and LAYER_BLUR 20, over GLASS approximated by one frost pane
 * per copy. The panes are siblings of the blurred layer, never inside it (a filtered or
 * translucent ancestor would hide the stage from their backdrop-filter, S§5). Both layers sit at
 * the bottom of the step, beneath every element Figma draws above 61:3. Drawn only while no row
 * plate is (I-69); decorative, `aria-hidden`.
 */
export function LegendSelectCardHalo({
  legends,
}: {
  readonly legends: readonly LegendCardView[];
}): ReactElement {
  const slotOf = (index: number) => legendSlot(legends.length, index);
  return (
    <>
      <div className={styles.glassLayer} aria-hidden="true">
        {legends.map((legend, index) => {
          const look = lookOf(legend);
          const origin = slotOf(index).refraction[look];
          return (
            <div
              key={legend.specId}
              className={styles.pane}
              data-look={look}
              style={legendCardStyle(origin, undefined)}
            >
              <ArchCard layers={PANE_LAYERS} artAssetId={null} origin={originRemainder(origin)} />
            </div>
          );
        })}
      </div>
      <div className={styles.refractionLayer} aria-hidden="true">
        {legends.map((legend, index) => {
          const look = lookOf(legend);
          const origin = slotOf(index).refraction[look];
          const artBox = legendArtBox(
            legend.refractionArtAssetId,
            COPY_RENDITIONS[look],
            offset(origin, ART_INSETS[look]),
          );
          const artMode = artBox === undefined ? 'cover' : 'image';
          return (
            <div
              key={legend.specId}
              className={styles.copy}
              data-look={look}
              data-art-mode={artMode}
              style={legendCardStyle(origin, artBox)}
            >
              <ArchCard
                layers={COPY_LAYERS[look]}
                artAssetId={legend.refractionArtAssetId}
                artMode={artMode}
                artRendition={artMode === 'image' ? COPY_RENDITIONS[look] : undefined}
                origin={originRemainder(origin)}
              />
              <span className={styles.title} style={{ color: `var(${legend.accentToken})` }}>
                {legend.subClassName}
              </span>
              {legend.legendName !== null && (
                <span className={styles.name}>{legend.legendName}</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
