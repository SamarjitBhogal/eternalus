import type { KeyboardEvent, ReactElement } from 'react';

import type { AssetId, LegendClassCard } from '../../bridge/catalogue.types';
import { isSelectableClass } from '../../bridge/selectionRules';
import { ArchCard, type ArchArtMode, type ArchLayerKind } from '../components/ArchCard';
import { cssVars } from '../components/cssVars';
import { LockGlyph } from '../components/LockGlyph';
import { useAssetUrl } from '../components/useAssetUrl';
import { STRINGS } from '../strings';
import {
  CLASS_CARD_PLATES,
  type ClassCardPlate,
  PLATE_BOX_TOLERANCE,
} from './ClassSelectCard.constants';
import styles from './ClassSelectCard.module.css';
import { classArtOrigin, classCardStyle, overlayVars, plateVars } from './classSelectLayout';
import type { ClassCardLook, ClassSlot } from './classSelectLayout.types';
import { originRemainder } from './legendSelectLayout';
import type { FramePoint } from './legendSelectLayout.types';

/** Bottom to top (62:162): outer frame 62:163, art 62:164, inner GLASS overlay 62:177, focus ring. */
const LAYERS: readonly ArchLayerKind[] = ['outer-outline', 'art', 'inner-outline', 'focus-ring'];

/** The plate of `plateId` when it was cut at this card's art box (I-45), else `undefined`. */
function plateHere(
  plateId: AssetId | undefined,
  artOrigin: FramePoint,
): ClassCardPlate | undefined {
  const plate = plateId === undefined ? undefined : CLASS_CARD_PLATES[plateId];
  const isHere =
    plate !== undefined &&
    Math.abs(plate.box.left - artOrigin.x) < PLATE_BOX_TOLERANCE &&
    Math.abs(plate.box.top - artOrigin.y) < PLATE_BOX_TOLERANCE;
  return isHere ? plate : undefined;
}

/**
 * One class card of the class step (62:162 idle, 62:152 picked): a `radio` button at its slot,
 * the arch, the class name in its accent, the role and "N Allies" (allied bots on the class,
 * F3). The art is the look's Figma plate where the catalogue has one cut at this slot and it is
 * loaded (plate mode: both 1 px strokes live at their own nodes, OD-1); otherwise the live art
 * (cover mode: the art's own 1 px stroke, and the overlay's 1 px stroke at the overlay node, the
 * slot's `overlay` offset). A locked class stays focusable with `aria-disabled` and shows a lock
 * and "Locked" instead of its ally count (CD-05).
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
}: {
  readonly card: LegendClassCard;
  /** The card's slot in the row (`classSlot`). */
  readonly slot: ClassSlot;
  readonly allyCount: number;
  readonly isPicked: boolean;
  /** A hover or focus preview shows this card in the panel (the hover cue, CD-11). */
  readonly isPreviewed: boolean;
  /** Holds the group's tab stop (roving tabindex). */
  readonly isTabbable: boolean;
  /** Takes the focus on mount: the class Back returned to (CD-11, WCAG 2.4.3). */
  readonly isAutoFocused: boolean;
  /** Id of the panel that describes the shown class. */
  readonly describedBy: string;
  readonly onPick: () => void;
  /** A hover or focus starts (`true`) or ends (`false`) this card's panel preview. */
  readonly onPreview: (isPreviewing: boolean) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}): ReactElement {
  const look: ClassCardLook = isPicked ? 'picked' : 'idle';
  const origin = slot.card[look];
  const artOrigin = classArtOrigin(origin, look);
  const plateId = card.art.cardPlates[look];
  const plateUrl = useAssetUrl(plateId ?? null);
  const plate = plateUrl === null ? undefined : plateHere(plateId, artOrigin);
  const artMode: ArchArtMode = plate === undefined ? 'cover' : 'plate';
  const isAvailable = isSelectableClass(card);
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
          : plateVars(origin, plate.box, artOrigin, plate.overlayOrigin)),
        ...cssVars({ '--card-accent': `var(${card.accentToken})` }),
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
        layers={LAYERS}
        artAssetId={plate === undefined ? card.art.card : (plateId ?? null)}
        artMode={artMode}
        origin={originRemainder(origin)}
      />
      <span className={styles.name}>{card.displayName}</span>{' '}
      <span className={styles.role}>{card.roleLabel}</span>{' '}
      {isAvailable ? (
        <span className={styles.allies}>{STRINGS.characterSelect.allyCount(allyCount)}</span>
      ) : (
        <span className={styles.allies}>
          <LockGlyph className={styles.lockGlyph} />
          {STRINGS.characterSelect.locked}
        </span>
      )}
    </button>
  );
}
