import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { selectMatchClockText } from '../../bridge/selectors/selectMatchClockText';
import { STRINGS } from '../strings';
import styles from './MatchClock.module.css';

/** The elapsed match time (Figma "14:32" 65:604) as `mm:ss`; "—" before the first tick. */
export function MatchClock(): ReactElement {
  const text = useAppSelector(selectMatchClockText);
  return (
    <div role="timer" aria-label={STRINGS.hud.matchClock} className={styles.clock}>
      {text ?? STRINGS.hud.noData}
    </div>
  );
}
