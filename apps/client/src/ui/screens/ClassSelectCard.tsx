import type { KeyboardEvent, ReactElement } from 'react';

import type { LegendClassCard } from '../../bridge/catalogue.types';
import { isSelectableClass } from '../../bridge/selectionRules';
import { ArchCard, type ArchArtMode, type ArchLayerKind } from '../components/ArchCard';
import { cssVars } from '../components/cssVars';
import { LockGlyph } from '../components/LockGlyph';
import { useAssetBox } from '../components/useAssetBox';
import { useAssetUrl } from '../components/useAssetUrl';
import { STRINGS } from '../strings';
import styles from './ClassSelectCard.module.css';
import { classArtOrigin, classCardStyle, overlayVars, plateVars } from './classSelectLayout';
import type { ClassCardLook, ClassSlot } from './classSelectLayout.types';
import { isBakedAt } from './isBakedAt';
import { offset, originRemainder } from './selectionGeometry';

/** Bottom to top (62:162): outer frame 62:163, art 62:164, inner GLASS overlay 62:177, focus ring. */
const LAYERS: readonly ArchLayerKind[] = ['outer-outline', 'art', 'inner-outline', 'focus-ring'];

/**
 * One class card of the class step (62:162 idle, 62:152 picked): a `radio` button at its slot,
 * the arch, the class name in its accent, the role and "N Allies" (allied bots on the class,
 * F3). The art is the look's Figma plate where the catalogue has one, loaded, with a draw box
 * baked at this card's art (plate mode: both 1 px strokes live at their own nodes, OD-1);
 * otherwise the live art (cover mode: the art's own 1 px stroke). Either way the overlay's 1 px
 * stroke sits at the overlay node, the slot's `overlay` offset from the art. A locked class stays
 * focusable with `aria-disabled` and shows a lock and "Locked" instead of its ally count (CD-05).
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
  const plateId = card.art.cardPlates[look] ?? null;
  const plateUrl = useAssetUrl(plateId);
  const plateBox = useAssetBox(plateId);
  const plate = plateUrl !== null && isBakedAt(plateBox, artOrigin) ? plateBox : undefined;
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
          : plateVars(origin, plate, artOrigin, offset(artOrigin, slot.overlay[look]))),
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
        artAssetId={plate === undefined ? card.art.card : plateId}
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
