import type { ReactElement } from 'react';

import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { LegendClassId } from '../../bridge/domain.types';
import { ArchCard, type ArchLayerKind } from '../components/ArchCard';
import { ARCH_UNIT_PATH } from '../components/archUnitPath';
import { cssVars } from '../components/cssVars';
import styles from './ClassSelectCardHalo.module.css';
import { classCardStyle, classSlot } from './classSelectLayout';
import type { ClassCardLook } from './classSelectLayout.types';
import { originRemainder } from './legendSelectLayout';

/** A copy's layers, bottom to top (62:195): outer 62:196, art 62:197, inner overlay 62:198. */
const COPY_LAYERS: readonly ArchLayerKind[] = ['outer-outline', 'art', 'inner-outline'];

/** One GLASS pane per copy (CD-15): the frost only. */
const PANE_LAYERS: readonly ArchLayerKind[] = ['glass'];

const LOOKS: readonly ClassCardLook[] = ['idle', 'picked'];

/** 62:200's LAYER_BLUR 20 as σ: the copies' blur, which in Figma also softens the GLASS edge. */
const HALO_BLUR_SIGMA = 10;

/** The blur that fades a pane's arch edge, and one arch mask per look (masks are drawn in px). */
const FROST_FADE_ID = 'sel-halo-frost-fade';
const FROST_MASK_IDS: Readonly<Record<ClassCardLook, string>> = {
  idle: 'sel-halo-frost-idle',
  picked: 'sel-halo-frost-picked',
};
const MASK_ARCH_CLASSES: Readonly<Record<ClassCardLook, string | undefined>> = {
  idle: styles.maskArchIdle,
  picked: styles.maskArchPicked,
};

/**
 * Each look's frost mask: the copy's arch blurred at the halo's σ, so the frost fades across the
 * arch edge as Figma's layer blur fades it, instead of a crisp clip (WP-CLASS CSS audit H1).
 */
const frostMasks = (): ReactElement => (
  <svg className={styles.defs} width="0" height="0" focusable="false">
    <defs>
      <filter id={FROST_FADE_ID}>
        <feGaussianBlur stdDeviation={HALO_BLUR_SIGMA} />
      </filter>
      {LOOKS.map((look) => (
        <mask key={look} id={FROST_MASK_IDS[look]} className={styles.frostMask}>
          <g filter={`url(#${FROST_FADE_ID})`}>
            <path className={MASK_ARCH_CLASSES[look]} d={ARCH_UNIT_PATH} />
          </g>
        </mask>
      ))}
    </defs>
  </svg>
);

/**
 * The live halo of the class row (62:200, CD-15): a larger copy of every card (frame, art, overlay
 * and name) behind the crisp cards, under the group's LAYER_BLUR 20, over GLASS approximated by
 * one frost pane per copy. The panes are siblings of the blurred layer, never inside it (a
 * filtered ancestor would hide the stage from their backdrop-filter), so the layer blur's fade of
 * their arch edge is drawn by a blurred-arch mask. Drawn only while no row plate is (I-69);
 * decorative, `aria-hidden`.
 */
export function ClassSelectCardHalo({
  cards,
  pickedClassId,
}: {
  readonly cards: readonly LegendClassCard[];
  readonly pickedClassId: LegendClassId | null;
}): ReactElement {
  const copyOf = (card: LegendClassCard, index: number) => {
    const look: ClassCardLook = card.classId === pickedClassId ? 'picked' : 'idle';
    return { look, origin: classSlot(cards.length, index).copy[look] };
  };
  return (
    <>
      <div className={styles.frostLayer} aria-hidden="true">
        {frostMasks()}
        {cards.map((card, index) => {
          const { look, origin } = copyOf(card, index);
          return (
            <div
              key={card.classId}
              className={styles.pane}
              data-look={look}
              style={classCardStyle(origin)}
            >
              <ArchCard layers={PANE_LAYERS} artAssetId={null} origin={originRemainder(origin)} />
            </div>
          );
        })}
      </div>
      <div className={styles.refractionLayer} aria-hidden="true">
        {cards.map((card, index) => {
          const { look, origin } = copyOf(card, index);
          return (
            <div
              key={card.classId}
              className={styles.copy}
              data-look={look}
              style={{
                ...classCardStyle(origin),
                ...cssVars({ '--card-accent': `var(${card.accentToken})` }),
              }}
            >
              <ArchCard
                layers={COPY_LAYERS}
                artAssetId={card.art.card}
                origin={originRemainder(origin)}
              />
              <span className={styles.name}>{card.displayName}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
