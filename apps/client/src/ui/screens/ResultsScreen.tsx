import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { selectMatchDurationText } from '../../bridge/selectors/selectMatchDurationText';
import { selectMatchVerdict } from '../../bridge/selectors/selectMatchVerdict';
import { selectVerdictLine } from '../../bridge/selectors/selectVerdictLine';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { Button } from '../components/Button';
import { Countdown } from '../components/Countdown';
import { ScreenFrame } from '../components/ScreenFrame';
import { SelectionBanner } from '../components/SelectionBanner';
import { SelectionDefs } from '../components/SelectionDefs';
import { SelectionStage, type VignetteEdge } from '../components/SelectionStage';
import { TeamBadge } from '../components/TeamBadge';
import { STRINGS } from '../strings';
import styles from './ResultsScreen.module.css';

/** Both edges darkened, as on the class step (62:125): the banner sits on the top one. */
const VIGNETTES: readonly VignetteEdge[] = ['top', 'bottom'];

/**
 * The win/lose screen (13 §3, DEC-78) in the character-select style (game-loop plan §8): the
 * verdict as the banner's title, the session's countdown, the verdict line from content, the
 * match's length, then Continue (skips the wait), a rematch and the main menu.
 */
export function ResultsScreen(): ReactElement {
  const verdict = useAppSelector(selectMatchVerdict);
  const line = useAppSelector(selectVerdictLine);
  const duration = useAppSelector(selectMatchDurationText);
  const seconds = useAppSelector(matchSetupSlice.selectors.selectResultsSeconds);
  const team = useAppSelector(matchSetupSlice.selectors.selectPlayerTeam);
  const bannerAssetId = useAppSelector(contentSlice.selectors.selectSelectionBannerAssetId);
  const status = verdict === null ? STRINGS.results.noResult : line;
  return (
    <ScreenFrame team={team ?? 'neutral'} layout="stage">
      <SelectionStage vignettes={VIGNETTES}>
        <SelectionDefs />
        <SelectionBanner
          title={verdict === null ? STRINGS.results.title : STRINGS.results.verdicts[verdict]}
          bannerAssetId={bannerAssetId}
        />
        <Countdown remainingSeconds={seconds} label={STRINGS.results.countdownLabel} />
        <div className={styles.summary}>
          {status !== null && (
            <p className={styles.line} role="status">
              {status}
            </p>
          )}
          {duration !== null && (
            <p className={styles.duration}>{STRINGS.results.duration(duration)}</p>
          )}
          <div className={styles.actions}>
            <Button
              autoFocus
              onClick={() => {
                emitIntent({ kind: 'continue' });
              }}
            >
              {STRINGS.results.continue}
            </Button>
            {/* ponytail: Play again and Main menu stay here until the post-game screen (plan task
                GL-10) exists, then move there as DEC-78 says (DEC-129 (2)). */}
            <Button
              onClick={() => {
                emitIntent({ kind: 'start-match' });
              }}
            >
              {STRINGS.results.playAgain}
            </Button>
            <Button
              onClick={() => {
                emitIntent({ kind: 'navigate', route: 'home' });
              }}
            >
              {STRINGS.results.mainMenu}
            </Button>
          </div>
        </div>
        <TeamBadge team={team} />
      </SelectionStage>
    </ScreenFrame>
  );
}
