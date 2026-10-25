import type { KeyboardEvent, ReactElement } from 'react';

import type { RenditionKey } from '../../bridge/catalogue.types';
import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { ArchCard, type ArchLayerKind } from '../components/ArchCard';
import { cssVars } from '../components/cssVars';
import { LockGlyph } from '../components/LockGlyph';
import { useAssetBox } from '../components/useAssetBox';
import { STRINGS } from '../strings';
import { isBakedAt } from './isBakedAt';
import styles from './LegendSelectCard.module.css';
import { legendCardStyle } from './legendSelectLayout';
import type { LegendCardLook, LegendSlot } from './legendSelectLayout.types';
import { offset, originRemainder } from './selectionGeometry';
import type { FramePoint } from './selectionGeometry.types';

/** Where each look's art sits in the card: 55:255 (11.42, 16), 58:360 (4.51, 5.42). */
const ART_INSETS: Readonly<Record<LegendCardLook, FramePoint>> = {
  idle: { x: 4.51, y: 5.42 },
  picked: { x: 11.42, y: 16 },
};

/** The art rendition of each look (I-45: the file of that look's exact box). */
const CARD_RENDITIONS: Readonly<Record<LegendCardLook, RenditionKey>> = {
  idle: 'card-idle',
  picked: 'card-picked',
};

/**
 * The layers of each look, bottom to top. Picked (55:267): shadow plate 58:351, inner frame
 * 55:256, Rectangle 32 (58:354), art 55:255, its 2 px stroke, focus ring. Idle (55:268): outer
 * outline 55:265, inner outline 55:266, art 58:360, focus ring.
 */
const LOOK_LAYERS: Readonly<Record<LegendCardLook, readonly ArchLayerKind[]>> = {
  picked: ['shadow-plate', 'inner-outline', 'text-scrim', 'art', 'outer-outline', 'focus-ring'],
  idle: ['outer-outline', 'inner-outline', 'art', 'focus-ring'],
};

/** In row-plate mode the plate holds the picked card's art, frame and glows (I-69). */
const ROW_PLATE_LAYERS: readonly ArchLayerKind[] = ['focus-ring'];

/**
 * One Legend card of the Legend step (55:267 picked, 55:268 idle): a `radio` button at its slot
 * with the arch drawn live and the sub-class title in the Legend's accent, then the Legend's name
 * for the player's team (omitted when it has none, I-83). The art is the look's rendition at its
 * manifest draw box (I-45); without a box baked for this card, the art in cover mode or the
 * placeholder. In row-plate mode (`isRowPlateMode`, I-69) only the text, the focus ring and the
 * hit area are drawn. A locked Legend stays focusable with `aria-disabled` and a lock with "Locked".
 */
export function LegendSelectCard({
  legend,
  slot,
  isRowPlateMode,
  isTabbable,
  onPick,
  onPreview,
  onKeyDown,
}: {
  readonly legend: LegendCardView;
  /** The card's slot in the row (`legendSlot`): its box and text offsets per look. */
  readonly slot: LegendSlot;
  readonly isRowPlateMode: boolean;
  /** Holds the group's tab stop (roving tabindex) and the focus on entry. */
  readonly isTabbable: boolean;
  readonly onPick: () => void;
  /** A hover or focus starts (`true`) or ends (`false`) this card's panel preview. */
  readonly onPreview: (isPreviewing: boolean) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}): ReactElement {
  const look: LegendCardLook = legend.isPicked ? 'picked' : 'idle';
  const origin = slot.card[look];
  const rendition = CARD_RENDITIONS[look];
  const box = useAssetBox(legend.cardArtAssetId, rendition);
  const artBox = isBakedAt(box, offset(origin, ART_INSETS[look])) ? box : undefined;
  const artMode = artBox === undefined ? 'cover' : 'image';
  return (
    <button
      type="button"
      role="radio"
      className={styles.card}
      aria-checked={legend.isPicked}
      aria-disabled={legend.isAvailable ? undefined : true}
      data-spec-id={legend.specId}
      data-look={look}
      data-art-mode={artMode}
      tabIndex={isTabbable ? 0 : -1}
      autoFocus={isTabbable}
      style={{
        ...legendCardStyle(origin, artBox, slot.text[look]),
        ...cssVars({ '--card-accent': `var(${legend.accentToken})` }),
      }}
      onClick={onPick}
      onKeyDown={onKeyDown}
      onFocus={() => {
        onPreview(true);
      }}
      onBlur={() => {
        onPreview(false);
      }}
      onPointerEnter={() => {
        onPreview(true);
      }}
      onPointerLeave={() => {
        onPreview(false);
      }}
    >
      <ArchCard
        layers={isRowPlateMode ? ROW_PLATE_LAYERS : LOOK_LAYERS[look]}
        artAssetId={legend.cardArtAssetId}
        artMode={artMode}
        artRendition={artMode === 'image' ? rendition : undefined}
        origin={originRemainder(origin)}
      />
      <span className={styles.title}>{legend.subClassName}</span>
      {legend.legendName !== null && (
        <>
          {' '}
          <span className={styles.name}>{legend.legendName}</span>
        </>
      )}
      {!legend.isAvailable && (
        <>
          {' '}
          <span className={styles.locked}>
            <LockGlyph className={styles.lockGlyph} />
            {STRINGS.characterSelect.locked}
          </span>
        </>
      )}
    </button>
  );
}
