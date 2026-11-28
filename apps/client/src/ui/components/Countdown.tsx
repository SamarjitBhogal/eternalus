import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { STRINGS } from '../strings';
import { COUNTDOWN_URGENCY } from './Countdown.constants';
import styles from './Countdown.module.css';
import { useLiveRegion } from './useLiveRegion';

/** UE-01's state of a numeral, `undefined` above the tick threshold. */
const urgencyOf = (seconds: number): 'tick' | 'final' | undefined => {
  if (seconds <= COUNTDOWN_URGENCY.finalFrom) return 'final';
  if (seconds <= COUNTDOWN_URGENCY.tickFrom) return 'tick';
  return undefined;
};

/**
 * A countdown numeral in the character select's look (62:135, 58:281: the countdown red, Cinzel
 * Bold, the sel-glow-countdown glow): whole seconds left, on the selection artboard or, at
 * `size="match"`, the pre-match overlay's size (DEC-278). A `timer` named by `label`, so assistive
 * technology reads it on demand and never announces each tick. The session owns the time; this
 * only shows it.
 *
 * With `hasUrgency` and the `countdown-urgency` enhancement on (UE-01, DEC-100, DEC-282), the
 * numeral is keyed on its value and marked `data-urgent` (`tick` from 10 s, `final` from 5 s),
 * which its CSS turns into one tick, or a larger pulse and the urgent glow, per second change; at
 * 10 and 5 s it says `STRINGS.countdownAlert` in the app's polite live region (`LiveRegion`,
 * DEC-282 (7)), which is in the page before any countdown, so the overlay, which appears at 10 s,
 * is heard too. Otherwise it is the Figma's static numeral, with no mark and no line.
 */
export function Countdown({
  remainingSeconds,
  label,
  size = 'artboard',
  zeroText,
  hasUrgency = false,
}: {
  readonly remainingSeconds: number;
  /** What the time is for (the character select's, the win/lose screen's, the match start's). */
  readonly label: string;
  /**
   * Where it is drawn: the select's box on a `SelectionStage` artboard (the default), whose
   * `--stage-scale` the font floor reads, or the middle of the pre-match overlay, inside the HUD
   * frame, whose `--hud-u` gives that scale (DEC-312).
   */
  readonly size?: 'artboard' | 'match';
  /** Shown in place of 0 (the overlay's START); the number otherwise. */
  readonly zeroText?: string;
  /** Whether UE-01 applies to this countdown; the enhancement switch decides whether it shows. */
  readonly hasUrgency?: boolean;
}): ReactElement {
  const isUrgencyOn =
    useAppSelector((state) =>
      contentSlice.selectors.selectIsUiEnhancementOn(state, 'countdown-urgency'),
    ) && hasUrgency;
  const region = useLiveRegion();
  const numeral = (
    <p
      key={isUrgencyOn ? remainingSeconds : undefined}
      className={`${String(styles.countdown)} ${String(styles[size])}`}
      role="timer"
      aria-label={label}
      data-urgent={isUrgencyOn ? urgencyOf(remainingSeconds) : undefined}
    >
      {remainingSeconds === 0 && zeroText !== undefined ? zeroText : remainingSeconds}
    </p>
  );
  const isLineSaid =
    isUrgencyOn &&
    (remainingSeconds === COUNTDOWN_URGENCY.tickFrom ||
      remainingSeconds === COUNTDOWN_URGENCY.finalFrom);
  return (
    <>
      {numeral}
      {isLineSaid && region !== null
        ? createPortal(STRINGS.countdownAlert(remainingSeconds), region)
        : null}
    </>
  );
}
