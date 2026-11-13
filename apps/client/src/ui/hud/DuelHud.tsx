import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import styles from './DuelHud.module.css';

/**
 * The Duel's scoreboard ("3 - 1", with "first to 10" beside it) and the pre-match countdown
 * (3, 2, 1, then START), both from the `duel-state` the match publishes. Renders nothing outside
 * a Duel.
 */
export function DuelHud(): ReactElement | null {
  const duel = useAppSelector(matchSlice.selectors.selectDuel);
  if (duel === null) return null;
  const { ownKills, opponentKills, killTarget, countdown } = duel;
  return (
    <>
      <p role="status" aria-label={STRINGS.hud.duelScore} className={styles.score}>
        {ownKills} - {opponentKills} ({STRINGS.hud.duelFirstTo(killTarget)})
      </p>
      {countdown !== null && (
        <p role="timer" aria-label={STRINGS.hud.duelCountdown} className={styles.countdown}>
          {countdown === 0 ? STRINGS.hud.duelStart : countdown}
        </p>
      )}
    </>
  );
}
