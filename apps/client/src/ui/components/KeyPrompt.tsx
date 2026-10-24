import type { ReactElement } from 'react';

import type { InputAction } from '../../bridge/Binding.types';
import { classNames } from './classNames';
import { KeyGlyph } from './KeyGlyph';
import styles from './KeyPrompt.module.css';
import { useActionShortcut } from './useActionShortcut';

/** The two key prompts of the selection screens: Back (58:328) and View Details (62:84). */
export type KeyPromptSkin = 'legend-back' | 'view-details';

const SKIN_CLASSES: Readonly<Record<KeyPromptSkin, string | undefined>> = {
  'legend-back': styles.legendBack,
  'view-details': styles.viewDetails,
};

/**
 * A key cap and a label that act together (F7): a button, and while mounted the key or mouse
 * button bound to `action` presses it too (`useActionShortcut`, I-54). The cap shows the live
 * binding (`KeyGlyph`), so a rebinding re-renders it; the accessible name is the cap then the
 * label ("Esc back", WCAG 2.5.3). Placed by its skin at its Figma node in the artboard.
 */
export function KeyPrompt({
  action,
  label,
  onPress,
  skin,
}: {
  readonly action: InputAction;
  readonly label: string;
  readonly onPress: () => void;
  readonly skin: KeyPromptSkin;
}): ReactElement {
  useActionShortcut(action, onPress);
  return (
    <button
      type="button"
      className={classNames(styles.prompt, SKIN_CLASSES[skin])}
      onClick={onPress}
    >
      <span className={styles.cap}>
        <KeyGlyph action={action} appearance="bare" />
      </span>{' '}
      <span className={styles.label}>{label}</span>
    </button>
  );
}
