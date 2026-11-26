import { type ReactElement, useEffect, useState } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { MS_PER_SECOND, OPPONENT_BANNER_TICK_MS } from './OpponentPresenceBanner.constants';
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
    <div className={styles.banner}>
      <p role="status">{STRINGS.duelOpponent.lostConnection}</p>
      <p role="timer" aria-label={STRINGS.duelOpponent.secondsLeft}>
        {STRINGS.duelOpponent.seconds(Math.ceil(remainingMs / MS_PER_SECOND))}
      </p>
    </div>
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
