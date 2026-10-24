import type { ReactElement } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import type { LegendStripItem } from '../../bridge/selectors/selectClassPanel';
import { ArchCard, type ArchLayerKind } from '../components/ArchCard';
import { cssVars } from '../components/cssVars';
import { STRINGS } from '../strings';
import { MINI_ART_BOXES, MINI_SLOT_LEFTS, MINI_TOP } from './ClassSelectLegendStrip.constants';
import styles from './ClassSelectLegendStrip.module.css';

/** A mini card's layers, bottom to top: outer frame 72:801, inner frame 72:802, portrait 72:803. */
const MINI_LAYERS: readonly ArchLayerKind[] = ['outer-outline', 'inner-outline', 'art'];

/** The inner frame's offset in the mini card (72:802 at +3, +3). */
const INNER_INSET = 3;

/** The mini's portrait box when its rendition was baked at this slot, else `undefined` (I-45). */
function miniArtBox(miniAssetId: AssetId | null, slotLeft: number) {
  const box = miniAssetId === null ? undefined : MINI_ART_BOXES[miniAssetId];
  const isHere = box !== undefined && Math.abs(box.left - (slotLeft + INNER_INSET)) <= 1;
  return isHere ? box : undefined;
}

/**
 * The class panel's Legends strip (72:786): the "Legends" header box and rule, then up to three
 * mini arch cards with the Legend's name for the player's team, else its sub-class title (I-83).
 * Informational: nothing in it is focusable or clickable. A class with no Legend shows the
 * pending line (CD-13); a portrait the catalogue lacks, or one baked for another slot, leaves the
 * designed empty arch.
 */
export function ClassSelectLegendStrip({
  items,
}: {
  readonly items: readonly LegendStripItem[];
}): ReactElement {
  return (
    <div className={styles.strip}>
      <span className={styles.headerBox} aria-hidden="true" />
      <h4 className={styles.headerText}>{STRINGS.characterSelect.legendsHeader}</h4>
      <svg className={styles.rules} aria-hidden="true" focusable="false">
        <rect className={styles.rule} />
      </svg>
      {items.length === 0 ? (
        <p className={styles.pending}>{STRINGS.characterSelect.legendsPending}</p>
      ) : (
        <ul className={styles.minis}>
          {MINI_SLOT_LEFTS.map((left, index) => {
            const item = items[index];
            if (item === undefined) return null;
            const box = miniArtBox(item.miniAssetId, left);
            return (
              <li
                key={item.key}
                className={styles.mini}
                data-slot={index}
                data-art-mode={box === undefined ? 'cover' : 'image'}
                style={
                  box === undefined
                    ? undefined
                    : cssVars({
                        '--art-left': `${String(box.left - left)}px`,
                        '--art-top': `${String(box.top - MINI_TOP)}px`,
                        '--art-width': `${String(box.width)}px`,
                        '--art-height': `${String(box.height)}px`,
                      })
                }
              >
                <ArchCard
                  layers={MINI_LAYERS}
                  artAssetId={box === undefined ? null : item.miniAssetId}
                  artMode={box === undefined ? 'cover' : 'image'}
                  artRendition={box === undefined ? undefined : 'legend-mini'}
                />
                <span className={styles.name}>{item.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
