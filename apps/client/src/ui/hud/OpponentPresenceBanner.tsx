import { type ReactElement, useEffect, useState } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { OPPONENT_BANNER_TICK_MS } from './OpponentPresenceBanner.constants';
import styles from './OpponentPresenceBanner.module.css';

/** The text with a live countdown from `graceMs`; remounted per disconnect, so it restarts. */
function Countdown({ graceMs }: { readonly graceMs: number }): ReactElement {
  const [remainingMs, setRemainingMs] = useState(graceMs);
  useEffect(() => {
    const endsAt = Date.now() + graceMs;
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, endsAt - Date.now()));
    }, OPPONENT_BANNER_TICK_MS);
    return () => {
      clearInterval(id);
    };
  }, [graceMs]);
  return (
    <p role="status" className={styles.banner}>
      {STRINGS.duelOpponent.lostConnection(Math.ceil(remainingMs / OPPONENT_BANNER_TICK_MS))}
    </p>
  );
}

/**
 * A non-blocking notice that the Duel opponent lost their connection, counting down the server's
 * reconnect window. Renders nothing while they are connected.
 */
export function OpponentPresenceBanner(): ReactElement | null {
  const graceMs = useAppSelector(matchSlice.selectors.selectOpponentGraceMs);
  return graceMs === null ? null : <Countdown key={graceMs} graceMs={graceMs} />;
}
