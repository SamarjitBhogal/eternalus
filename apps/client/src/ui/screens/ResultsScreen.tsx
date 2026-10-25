import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';

/** Results shell: the verdict (the winner named from content), then a rematch or the main menu. */
export function ResultsScreen(): ReactElement {
  const result = useAppSelector(matchSlice.selectors.selectMatchResult);
  const teamNames = useAppSelector(contentSlice.selectors.selectTeamNames);
  const verdict =
    result === null
      ? STRINGS.results.noResult
      : result.winner === null
        ? STRINGS.results.draw
        : STRINGS.results.winner(teamNames[result.winner]);
  return (
    <ScreenFrame>
      <Panel title={STRINGS.results.title}>
        <p role="status">{verdict}</p>
        <Button
          autoFocus
          onClick={() => {
            emitIntent({ kind: 'start-match' });
          }}
        >
          {STRINGS.results.playAgain}
        </Button>{' '}
        <Button
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
