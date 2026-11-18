import type { ReactElement } from 'react';

import { nextRovingIndex, rovingKeyDown, tabbableRovingIndex } from '../components/rovingRadio';
import styles from './LoadoutRadioGroup.module.css';

/** One choice of a `LoadoutRadioGroup`. */
type LoadoutChoice = { readonly id: string; readonly label: string };

/**
 * A labelled group of single-choice buttons with roving focus (WAI-ARIA APG radio group): the arrows
 * move the focus and the pick, Home and End jump to the ends, and the picked one holds the tab stop.
 */
export function LoadoutRadioGroup({
  label,
  choices,
  pickedId,
  onPick,
  autoFocusPicked = false,
}: {
  readonly label: string;
  readonly choices: readonly LoadoutChoice[];
  readonly pickedId: string | null;
  readonly onPick: (id: string) => void;
  readonly autoFocusPicked?: boolean;
}): ReactElement {
  const tabbable = tabbableRovingIndex(
    choices.map((choice) => ({ isAvailable: true, isPicked: choice.id === pickedId })),
  );
  const onKeyDown = rovingKeyDown((index, key) => {
    const next = nextRovingIndex(index, key, choices.length);
    const target = next === null ? undefined : choices[next];
    if (target !== undefined) onPick(target.id);
    return next;
  });
  return (
    <div role="radiogroup" aria-label={label} className={styles.group}>
      {choices.map((choice, index) => {
        const isPicked = choice.id === pickedId;
        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={isPicked}
            tabIndex={index === tabbable ? 0 : -1}
            autoFocus={autoFocusPicked && isPicked}
            className={isPicked ? styles.picked : styles.choice}
            onClick={() => {
              onPick(choice.id);
            }}
            onKeyDown={(event) => {
              onKeyDown(event, index);
            }}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
