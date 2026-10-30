import type { ReactElement, ReactNode } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { KeyPrompt } from '../components/KeyPrompt';
import { useModalKeyFilter } from '../components/useModalKeyFilter';
import { STRINGS } from '../strings';
import styles from './ViewDetailsScreen.module.css';

const { characterSelect: text } = STRINGS;

/**
 * View Details (DEC-65, DEC-103; Figma 145:2 "View Details Example"): a full screen over the
 * selection step, its children the step's own panel laid out for it (`InfoPanel`'s `*-details`
 * layouts, the class's Legends strip). The step underneath is blurred and shaded by one backdrop
 * shape; while open only Escape works (`useModalKeyFilter`: a `pause-menu` key closes, every other
 * key is stopped), and Esc Back (148:203) takes the focus. It opens with a quick fade and grow and
 * closes by fading while it shrinks to 80 %; closed, it is invisible and inert. It stays mounted, so
 * CSS alone runs both ways; the motion stops under `prefers-reduced-motion` (the motion tokens) and
 * under the in-game reduce-motion setting (`data-reduce-motion`, an interim reading of the setting
 * until UE-03 applies it to the whole page), and it still opens and closes.
 */
export function ViewDetailsScreen({
  isOpen,
  onClose,
  children,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}): ReactElement {
  const { reduceMotion } = useAppSelector(settingsSlice.selectors.selectAccessibility);
  useModalKeyFilter(isOpen, onClose);
  return (
    <div
      className={styles.screen}
      role="dialog"
      aria-modal="true"
      aria-label={text.viewDetails}
      data-open={isOpen}
      data-reduce-motion={reduceMotion}
      inert={!isOpen}
    >
      <div className={styles.backdrop} />
      <div className={styles.content}>
        {children}
        {isOpen && (
          <KeyPrompt
            action="pause-menu"
            label={text.back}
            onPress={onClose}
            skin="details-back"
            isAutoFocused
          />
        )}
      </div>
    </div>
  );
}
