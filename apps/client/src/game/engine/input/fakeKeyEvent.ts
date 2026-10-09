/** A fake key event for Node tests, which have `Event` but no `KeyboardEvent`. */
export const fakeKeyEvent = (
  type: 'keydown' | 'keyup',
  code: string,
  options: { readonly key?: string; readonly repeat?: boolean; readonly ctrlKey?: boolean } = {},
): Event =>
  Object.assign(new Event(type, { cancelable: true }), {
    code,
    key: options.key ?? code,
    repeat: options.repeat ?? false,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: false,
  });
