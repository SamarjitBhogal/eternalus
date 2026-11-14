import type { ReactElement } from 'react';

import type { InputAction } from '../../bridge/Binding.types';
import { classNames } from './classNames';
import { KeyGlyph } from './KeyGlyph';
import styles from './KeyPrompt.module.css';
import { useActionShortcut } from './useActionShortcut';

/**
 * The key prompts of the selection screens: Back (58:328), the alternate layout's View Details
 * (62:84), V View Details on the class and Legend steps (DEC-103) and View Details' own Back
 * (148:203). All but `view-details` share 58:328's key line (`keyLine`) and differ in place.
 */
export type KeyPromptSkin =
  'legend-back' | 'view-details' | 'class-view-details' | 'legend-view-details' | 'details-back';

const SKIN_CLASSES: Readonly<Record<KeyPromptSkin, readonly (string | undefined)[]>> = {
  'legend-back': [styles.keyLine, styles.legendBack],
  'view-details': [styles.viewDetails],
  'class-view-details': [styles.keyLine, styles.classViewDetails],
  'legend-view-details': [styles.keyLine, styles.legendViewDetails],
  'details-back': [styles.keyLine, styles.detailsBack],
};

/**
 * A key cap and a label that act together (HC-F7): a button, and while mounted the key or mouse
 * button bound to `action` presses it too (`useActionShortcut`). The cap shows the live
 * binding (`KeyGlyph`), so a rebinding re-renders it; the accessible name is the cap then the
 * label ("Esc back", WCAG 2.5.3). Placed by its skin at its Figma node in the artboard; with
 * `isAutoFocused` it takes the focus when it mounts.
 */
export function KeyPrompt({
  action,
  label,
  onPress,
  skin,
  isAutoFocused = false,
}: {
  readonly action: InputAction;
  readonly label: string;
  readonly onPress: () => void;
  readonly skin: KeyPromptSkin;
  readonly isAutoFocused?: boolean;
}): ReactElement {
  useActionShortcut(action, onPress);
  return (
    <button
      type="button"
      className={classNames(styles.prompt, ...SKIN_CLASSES[skin])}
      onClick={onPress}
      autoFocus={isAutoFocused}
    >
      <span className={styles.cap}>
        <KeyGlyph action={action} appearance="bare" />
      </span>{' '}
      <span className={styles.label}>{label}</span>
    </button>
  );
}
