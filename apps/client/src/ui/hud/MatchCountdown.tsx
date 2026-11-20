import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { Countdown } from '../components/Countdown';
import { SelectionDefs } from '../components/SelectionDefs';
import { STRINGS } from '../strings';
import styles from './MatchCountdown.module.css';

/**
 * The pre-match countdown over the whole match screen (DEC-278): a tinted veil with the seconds
 * left in the middle, drawn by the character select's `Countdown` at the match size, so the look
 * (red Cinzel with its glow, whose defs it draws) and UE-01's urgency have one source (DEC-282);
 * START for a Duel's first second. Renders nothing once the countdown is over. A `timer` named
 * "Match start", so assistive technology reads it on demand and never announces each second. It
 * takes no pointer events: the player may turn during the countdown (DEC-88).
 */
export function MatchCountdown(): ReactElement | null {
  const countdown = useAppSelector(matchSlice.selectors.selectMatchCountdown);
  if (countdown === null) return null;
  return (
    <div className={styles.veil}>
      <SelectionDefs />
      <Countdown
        remainingSeconds={countdown}
        label={STRINGS.hud.matchCountdown}
        size="match"
        zeroText={STRINGS.hud.countdownStart}
        hasUrgency
      />
    </div>
  );
}
