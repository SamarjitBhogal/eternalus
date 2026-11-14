/** A fake key event for Node tests, which have `Event` but no `KeyboardEvent`. */
export const fakeKeyEvent = (
  type: 'keydown' | 'keyup',
  code: string,
  options: {
    readonly key?: string;
    readonly repeat?: boolean;
    readonly altKey?: boolean;
    readonly ctrlKey?: boolean;
    readonly metaKey?: boolean;
    readonly shiftKey?: boolean;
  } = {},
): Event =>
  Object.assign(new Event(type, { cancelable: true }), {
    code,
    key: options.key ?? code,
    repeat: options.repeat ?? false,
    altKey: options.altKey ?? false,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
  });
