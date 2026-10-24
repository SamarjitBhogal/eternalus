import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import type { HudAllegiance } from '../../bridge/hud.types';
import { selectAllegianceFlagUrls } from '../../bridge/selectors/selectAllegianceFlagUrls';
import { selectObjectives } from '../../bridge/selectors/selectObjectives';
import { contentSlice } from '../../bridge/slices/contentSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import { classNames } from '../components/classNames';
import { cssVars } from '../components/cssVars';
import { STRINGS } from '../strings';
import styles from './ObjectiveTracker.module.css';
import { StatusBar } from './StatusBar';

/**
 * The allegiance flag's place per holder (CD-03, 13 §7: ownership never by colour alone): ours
 * upright to the right of the shield, theirs mirrored to its left (`selectAllegianceFlagUrls`
 * gives it the `mirrored` rendition), none when neutral (no URL).
 */
const FLAG_CLASS: Readonly<Record<HudAllegiance, string | undefined>> = {
  ours: styles.flagOurs,
  theirs: styles.flagTheirs,
  neutral: undefined,
};

const selectChrome = (state: RootState) => contentSlice.selectors.selectHudCatalogue(state).chrome;

/** The objective's letter: A, B, C … from the strings in lane order, past them its number (I-07). */
const letterAt = (index: number): string =>
  STRINGS.hud.objectiveLetters[index] ?? String(index + 1);

/**
 * The capture objectives (Figma 62:425): per lane, the shield of its absolute owner with its letter
 * (inked by the owner's tokens, `data-team`), the allegiance flag and the capture bar. In the
 * `minimums` colour set each shield gets a token ring (OD-11 b); the `figma` set draws none.
 */
export function ObjectiveTracker(): ReactElement {
  const objectives = useAppSelector(selectObjectives);
  const chrome = useAppSelector(selectChrome);
  const flagUrls = useAppSelector(selectAllegianceFlagUrls);
  return (
    <div role="group" aria-label={STRINGS.hud.objectives} className={styles.tracker}>
      {objectives.map((objective, index) => {
        const letter = letterAt(index);
        const flagUrl = flagUrls[objective.allegiance];
        return (
          <div
            key={objective.pointId}
            role="group"
            aria-label={STRINGS.hud.objective(
              letter,
              objective.kindName,
              STRINGS.hud.allegiance[objective.allegiance],
            )}
            data-team={objective.ownerTeam}
            className={styles.objective}
          >
            <span className={styles.shieldRing}>
              <AssetImage
                assetId={chrome?.objectiveShieldAssetIds[objective.ownerTeam] ?? null}
                className={classNames(styles.shield)}
              />
            </span>
            <span className={styles.letter} aria-hidden="true">
              {letter}
            </span>
            {flagUrl !== null && (
              <span
                className={classNames(styles.flag, FLAG_CLASS[objective.allegiance])}
                aria-hidden="true"
                style={cssVars({ '--allegiance-flag': `url("${flagUrl}")` })}
              />
            )}
            <StatusBar
              label={STRINGS.hud.captureProgress}
              fraction={objective.captureFraction}
              className={styles.bar}
            />
          </div>
        );
      })}
    </div>
  );
}
