import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import styles from './ReconnectingNotice.module.css';

/**
 * "Reconnecting..." over the match while this player's Duel connection is down and the session
 * is taking the seat back on its own, with no click (DEC-349). Renders nothing otherwise.
 */
export function ReconnectingNotice(): ReactElement | null {
  const isReconnecting = useAppSelector(matchSlice.selectors.selectIsReconnecting);
  if (!isReconnecting) return null;
  return (
    <p role="status" className={styles.notice}>
      {STRINGS.hud.duelReconnecting}
    </p>
  );
}
