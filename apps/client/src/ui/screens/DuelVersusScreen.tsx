import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';

/** "NAME VS NAME": shown from the pairing until the server starts the match (ADR 0016). */
export function DuelVersusScreen(): ReactElement {
  const versus = useAppSelector(matchSlice.selectors.selectVersus);
  return (
    <ScreenFrame>
      <Panel title={STRINGS.duelVersus.title}>
        {versus !== null && (
          <p role="status">
            {STRINGS.duelVersus.matchFound} {versus.own} {STRINGS.duelVersus.versus}{' '}
            {versus.opponent}. {STRINGS.duelVersus.startsSoon}
          </p>
        )}
      </Panel>
    </ScreenFrame>
  );
}
