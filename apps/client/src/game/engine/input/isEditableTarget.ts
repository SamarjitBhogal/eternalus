import { EDITABLE_TAG_NAMES } from './isEditableTarget.constants';

/**
 * True when a key event came from a text-entry element (input, textarea, select or
 * contentEditable). The game listens on the window, so without this check it would steal the
 * keys typed into the developer menu's fields.
 */
export function isEditableTarget(event: Event): boolean {
  const { target } = event;
  if (target === null) return false;
  if ('isContentEditable' in target && target.isContentEditable === true) return true;
  return (
    'tagName' in target &&
    typeof target.tagName === 'string' &&
    EDITABLE_TAG_NAMES.includes(target.tagName)
  );
}
