/** A fake pointer event for Node tests, which have `Event` but no `PointerEvent`. */
export const fakePointerEvent = (
  type: 'pointerdown' | 'pointerup' | 'pointermove' | 'pointercancel' | 'pointerleave',
  options: {
    readonly buttons?: number;
    readonly button?: number;
    readonly x?: number;
    readonly y?: number;
  } = {},
): Event =>
  Object.assign(new Event(type, { cancelable: true }), {
    buttons: options.buttons ?? 0,
    button: options.button ?? 0,
    offsetX: options.x ?? 0,
    offsetY: options.y ?? 0,
    pointerId: 1,
  });
