import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import styles from './DuelHud.module.css';

/**
 * The Duel's scoreboard ("3 - 1", with "first to 10" beside it), from the `duel-state` the match
 * publishes; its countdown is `MatchCountdown`'s (DEC-278). Renders nothing outside a Duel.
 */
export function DuelHud(): ReactElement | null {
  const duel = useAppSelector(matchSlice.selectors.selectDuelHud);
  if (duel === null) return null;
  const { ownKills, opponentKills, killTarget } = duel;
  return (
    <p role="status" aria-label={STRINGS.hud.duelScore} className={styles.score}>
      {ownKills} - {opponentKills} ({STRINGS.hud.duelFirstTo(killTarget)})
    </p>
  );
}
