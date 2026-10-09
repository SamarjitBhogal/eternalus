import type { InputDevice, MutableInputSnapshot, ScreenPoint } from './InputDevice.types';
import {
  POINTER_EVENTS,
  PRIMARY_BUTTON,
  PRIMARY_BUTTON_BIT,
  SUPPRESSED_EVENTS,
} from './MouseDevice.constants';

/**
 * The mouse on the canvas (architecture 09 §2). Buttons come from the `buttons` bitmask, so the
 * side buttons work and an OS-level button swap is respected. The pointer is captured while a
 * button is held. The context menu, middle-click new tabs and autoscroll are cancelled so every
 * button can be bound.
 */
export class MouseDevice implements InputDevice {
  private buttons = 0;

  private pointer: ScreenPoint | null = null;

  private target: EventTarget | null = null;

  /** Starts listening to pointer events on `target` (the canvas). */
  public attach(target: EventTarget): void {
    this.detach();
    for (const type of POINTER_EVENTS) {
      target.addEventListener(type, this.onPointer);
    }
    for (const type of SUPPRESSED_EVENTS) {
      target.addEventListener(type, MouseDevice.suppress);
    }
    this.target = target;
  }

  /** Stops listening and forgets the buttons and the pointer. */
  public detach(): void {
    const { target } = this;
    for (const type of POINTER_EVENTS) {
      target?.removeEventListener(type, this.onPointer);
    }
    for (const type of SUPPRESSED_EVENTS) {
      target?.removeEventListener(type, MouseDevice.suppress);
    }
    this.target = null;
    this.pointer = null;
    this.releaseAll();
  }

  /** Adds the held buttons and, when it is on the canvas, the pointer to `snapshot`. */
  public writeInto(snapshot: MutableInputSnapshot): void {
    snapshot.mouseButtons |= this.buttons;
    snapshot.pointer = this.pointer ?? snapshot.pointer;
  }

  /** Forgets every held button; the pointer stays where it is. */
  public releaseAll(): void {
    this.buttons = 0;
  }

  private readonly onPointer = (event: Event): void => {
    if (!MouseDevice.isPointerEvent(event)) {
      return;
    }
    if (event.type === 'pointerleave') {
      this.pointer = null;
      return;
    }
    // A second button pressed while one is held arrives as a pointermove (a chorded press).
    const newButtons = event.buttons & ~this.buttons;
    this.buttons = event.buttons;
    this.pointer = { x: event.offsetX, y: event.offsetY };
    if (event.type === 'pointerdown') {
      MouseDevice.capture(event);
    }
    const isNonPrimaryPress =
      (event.type === 'pointerdown' && event.button !== PRIMARY_BUTTON) ||
      (newButtons & ~PRIMARY_BUTTON_BIT) !== 0;
    if (isNonPrimaryPress) {
      event.preventDefault();
    }
  };

  private static readonly suppress = (event: Event): void => {
    event.preventDefault();
  };

  /** Keeps the pointer's events on the canvas while a button is held, even off its edge. */
  private static capture(event: PointerEvent): void {
    const element = event.currentTarget;
    // Tests run without a DOM, where `Element` does not exist.
    if (typeof Element !== 'undefined' && element instanceof Element) {
      element.setPointerCapture(event.pointerId);
    }
  }

  private static isPointerEvent(event: Event): event is PointerEvent {
    return 'buttons' in event && 'offsetX' in event && 'offsetY' in event;
  }
}
