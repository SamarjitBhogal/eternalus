import type { ReactElement } from 'react';

import type { RenditionKey } from '../../bridge/catalogue.types';
import { shallowEqual, useAppSelector } from '../../bridge/hooks';
import type { HudAllegiance } from '../../bridge/hud.types';
import { selectObjectives } from '../../bridge/selectors/selectObjectives';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { contentSlice } from '../../bridge/slices/contentSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import { classNames } from '../components/classNames';
import { cssVars } from '../components/cssVars';
import { STRINGS } from '../strings';
import styles from './ObjectiveTracker.module.css';
import { StatusBar } from './StatusBar';

/**
 * The allegiance flag per holder (CD-03, 13 §7: ownership never by colour alone): ours upright to
 * the right of the shield, theirs mirrored to its left (the `mirrored` rendition), none when
 * neutral.
 */
const ALLEGIANCE_FLAG: Readonly<
  Record<
    HudAllegiance,
    { readonly className: string | undefined; readonly rendition?: RenditionKey } | null
  >
> = {
  ours: { className: styles.flagOurs },
  theirs: { className: styles.flagTheirs, rendition: 'mirrored' },
  neutral: null,
};

const selectChrome = (state: RootState) => contentSlice.selectors.selectHudCatalogue(state).chrome;

/** The URL of the flag mask per holder, `null` until loaded or without a flag. */
function selectFlagUrls(state: RootState): Readonly<Record<HudAllegiance, string | null>> {
  const flagId = selectChrome(state)?.allegianceFlagAssetId ?? null;
  const urlFor = (allegiance: HudAllegiance) => {
    const flag = ALLEGIANCE_FLAG[allegiance];
    return flag === null
      ? null
      : assetsSlice.selectors.selectAssetUrl(state, flagId, flag.rendition);
  };
  return { ours: urlFor('ours'), theirs: urlFor('theirs'), neutral: urlFor('neutral') };
}

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
  const flagUrls = useAppSelector(selectFlagUrls, shallowEqual);
  return (
    <div role="group" aria-label={STRINGS.hud.objectives} className={styles.tracker}>
      {objectives.map((objective, index) => {
        const letter = letterAt(index);
        const flag = ALLEGIANCE_FLAG[objective.allegiance];
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
            {flag !== null && flagUrl !== null && (
              <span
                className={classNames(styles.flag, flag.className)}
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
