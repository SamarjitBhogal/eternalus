import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { selectMatchDurationText } from '../../bridge/selectors/selectMatchDurationText';
import { type ResultsStatus, selectResultsView } from '../../bridge/selectors/selectResultsView';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { Button } from '../components/Button';
import { ScreenFrame } from '../components/ScreenFrame';
import { SelectionBanner } from '../components/SelectionBanner';
import { SelectionDefs } from '../components/SelectionDefs';
import { SelectionStage, type VignetteEdge } from '../components/SelectionStage';
import { TeamBadge } from '../components/TeamBadge';
import { STRINGS } from '../strings';
import styles from './ResultsScreen.module.css';
import { SessionCountdown } from './SessionCountdown';

/** Both edges darkened, as on the class step (62:125): the banner sits on the top one. */
const VIGNETTES: readonly VignetteEdge[] = ['top', 'bottom'];

/** The status line's text: a verdict line is content's own, the other two are fixed wording. */
function statusText(status: ResultsStatus): string {
  return status.kind === 'verdict-line' ? status.text : STRINGS.results.statuses[status.kind];
}

/**
 * The win/lose screen (13 §3, DEC-78) in the character-select style (game-loop plan §8): the
 * verdict as the banner's title, the session's countdown, the verdict line from content, the
 * match's length, then Continue (skips the wait), a rematch and the main menu. Only a local match
 * offers the rematch (an online Duel's setup is the server's, ADR 0016); a Duel the other player
 * left names that, not a verdict. `selectResultsView` decides all of it.
 */
export function ResultsScreen(): ReactElement {
  const { verdict, status, canRematch } = useAppSelector(selectResultsView);
  const duration = useAppSelector(selectMatchDurationText);
  const team = useAppSelector(matchSetupSlice.selectors.selectPlayerTeam);
  const bannerAssetId = useAppSelector(contentSlice.selectors.selectSelectionBannerAssetId);
  return (
    <ScreenFrame team={team ?? 'neutral'} layout="stage">
      <SelectionStage vignettes={VIGNETTES}>
        <SelectionDefs />
        <SelectionBanner
          title={verdict === null ? STRINGS.results.title : STRINGS.results.verdicts[verdict]}
          bannerAssetId={bannerAssetId}
        />
        <SessionCountdown kind="results" label={STRINGS.results.countdownLabel} />
        <div className={styles.summary}>
          {status !== null && (
            <p className={styles.line} role="status">
              {statusText(status)}
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
            {canRematch && (
              <Button
                onClick={() => {
                  emitIntent({ kind: 'start-match' });
                }}
              >
                {STRINGS.results.playAgain}
              </Button>
            )}
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
