import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import { resultVerdict } from './resultVerdict';

/** Results shell: the verdict (from the player's own team), then a rematch or the main menu. */
export function ResultsScreen(): ReactElement {
  const result = useAppSelector(matchSlice.selectors.selectMatchResult);
  // A local match leaves its setup for a rematch; an online Duel has none, so no rematch.
  const canRematch = useAppSelector(matchSetupSlice.selectors.selectAllies).length > 0;
  const verdict = result === null ? STRINGS.results.noResult : resultVerdict(result);
  return (
    <ScreenFrame>
      <Panel title={STRINGS.results.title}>
        <p role="status">{verdict}</p>
        {canRematch && (
          <>
            <Button
              autoFocus
              onClick={() => {
                emitIntent({ kind: 'start-match' });
              }}
            >
              {STRINGS.results.playAgain}
            </Button>{' '}
          </>
        )}
        <Button
          autoFocus={!canRematch}
          onClick={() => {
            emitIntent({ kind: 'navigate', route: 'home' });
          }}
        >
          {STRINGS.results.mainMenu}
        </Button>
      </Panel>
    </ScreenFrame>
  );
}
