import type { ReactElement } from 'react';

import { isSelectableClass } from '../../bridge/selectionRules';
import { ArchCard, type ArchArtMode, type ArchLayerKind } from '../components/ArchCard';
import { classNames } from '../components/classNames';
import { cssVars } from '../components/cssVars';
import { LockGlyph } from '../components/LockGlyph';
import { useAssetBox } from '../components/useAssetBox';
import { useAssetUrl } from '../components/useAssetUrl';
import { STRINGS } from '../strings';
import styles from './ClassSelectCard.module.css';
import type { ClassSelectCardProps } from './ClassSelectCard.types';
import { classArtOrigin, classCardStyle, overlayVars, plateVars } from './classSelectLayout';
import type { ClassCardLook } from './classSelectLayout.types';
import { isBakedAt } from './isBakedAt';
import { previewHandlers } from './previewHandlers';
import { offset, originRemainder } from './selectionGeometry';

/** Bottom to top (62:162): outer frame 62:163, art 62:164, inner GLASS overlay 62:177, focus ring. */
const LAYERS: readonly ArchLayerKind[] = ['outer-outline', 'art', 'inner-outline', 'focus-ring'];

/**
 * One class card of the class step (62:162 idle, 62:152 picked): a `radio` button at its slot,
 * the arch, the class name in its accent, the role and "N Allies" (allied bots on the class,
 * HC-F3). The art is the look's Figma plate where the catalogue has one, loaded, with a draw box
 * baked at this card's art (plate mode: both 1 px strokes live at their own nodes, OD-1);
 * otherwise the live art (cover mode: the art's own 1 px stroke). Either way the overlay's 1 px
 * stroke sits at the overlay node, the slot's `overlay` offset from the art. A locked class stays
 * focusable with `aria-disabled`; inside the same frame it draws a dark void with a weathered lock
 * in the middle instead of its art, and only "Coming Soon..." in place of its name, role and ally
 * count (DEC-59, DEC-104).
 */
export function ClassSelectCard({
  card,
  slot,
  allyCount,
  isPicked,
  isPreviewed,
  isTabbable,
  isAutoFocused,
  describedBy,
  onPick,
  onPreview,
  onKeyDown,
}: ClassSelectCardProps): ReactElement {
  const look: ClassCardLook = isPicked ? 'picked' : 'idle';
  const origin = slot.card[look];
  const artOrigin = classArtOrigin(origin, look);
  const isAvailable = isSelectableClass(card);
  // DEC-104: a locked class draws the void, never its art or plate.
  const plateId = isAvailable ? (card.art.cardPlates[look] ?? null) : null;
  const plateUrl = useAssetUrl(plateId);
  const plateBox = useAssetBox(plateId);
  const plate = plateUrl !== null && isBakedAt(plateBox, artOrigin) ? plateBox : undefined;
  const artMode: ArchArtMode = plate === undefined ? 'cover' : 'plate';
  const coverArt = isAvailable ? card.art.card : null;
  return (
    <button
      type="button"
      role="radio"
      className={styles.card}
      aria-checked={isPicked}
      aria-disabled={isAvailable ? undefined : true}
      aria-describedby={describedBy}
      data-class-id={card.classId}
      data-look={look}
      data-art-mode={artMode}
      data-previewed={isPreviewed ? true : undefined}
      tabIndex={isTabbable ? 0 : -1}
      autoFocus={isAutoFocused}
      style={{
        ...classCardStyle(origin, slot.text[look]),
        ...(plate === undefined
          ? overlayVars(slot.overlay[look])
          : plateVars(origin, plate, artOrigin, offset(artOrigin, slot.overlay[look]))),
        ...cssVars({ '--card-accent': `var(${card.accentToken})` }),
      }}
      onClick={onPick}
      onKeyDown={onKeyDown}
      {...previewHandlers(onPreview)}
    >
      <ArchCard
        layers={LAYERS}
        artAssetId={plate === undefined ? coverArt : plateId}
        artMode={artMode}
        origin={originRemainder(origin)}
      />
      {isAvailable ? (
        <>
          <span className={styles.name}>{card.displayName}</span>{' '}
          <span className={styles.role}>{card.roleLabel}</span>{' '}
          <span className={styles.allies}>{STRINGS.characterSelect.allyCount(allyCount)}</span>
        </>
      ) : (
        <>
          <LockGlyph className={styles.voidLock} />
          <span className={classNames(styles.name, styles.comingSoon)}>
            {STRINGS.characterSelect.comingSoon}
          </span>
        </>
      )}
    </button>
  );
}
