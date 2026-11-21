/**
 * Upper-case tag names of the elements that take typed text (`Element.tagName` in HTML). A
 * `SELECT` is not one: it keeps focus after a pick, and F1 and the movement keys must still work.
 */
export const EDITABLE_TAG_NAMES: readonly string[] = ['INPUT', 'TEXTAREA'];
