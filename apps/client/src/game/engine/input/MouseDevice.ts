import type { InputDevice, MutableInputSnapshot, ScreenPoint } from './InputDevice.types';
import {
  BUTTON_BITS,
  MAIN_BUTTON,
  POINTER_EVENTS,
  SUPPRESSED_EVENTS,
} from './MouseDevice.constants';

/**
 * The mouse adapter, on pointer events over the canvas. Reads every button, side buttons
 * included, from the `buttons` bitmask; keeps the browser from acting on non-main buttons
 * (autoscroll, paste, back/forward, context menu); captures the pointer while a button is held.
 */
export class MouseDevice implements InputDevice {
  private buttons = 0;
  private pointer: ScreenPoint | null = null;
  private target: EventTarget | null = null;

  /** Starts listening to pointer events on `target`, normally the game canvas. */
  public attach(target: EventTarget): void {
    this.detach();
    POINTER_EVENTS.forEach((type) => {
      target.addEventListener(type, this.onPointer);
    });
    SUPPRESSED_EVENTS.forEach((type) => {
      target.addEventListener(type, MouseDevice.suppress);
    });
    target.addEventListener('pointercancel', this.onCancel);
    this.target = target;
  }

  /** Stops listening and releases every button. */
  public detach(): void {
    const target = this.target;
    if (target !== null) {
      POINTER_EVENTS.forEach((type) => {
        target.removeEventListener(type, this.onPointer);
      });
      SUPPRESSED_EVENTS.forEach((type) => {
        target.removeEventListener(type, MouseDevice.suppress);
      });
      target.removeEventListener('pointercancel', this.onCancel);
      this.target = null;
    }
    this.releaseAll();
  }

  /** Adds the held buttons and, once known, the pointer position to `snapshot`. */
  public writeInto(snapshot: MutableInputSnapshot): void {
    for (const [bit, button] of BUTTON_BITS) {
      if ((this.buttons & bit) !== 0) {
        snapshot.mouseButtons.add(button);
      }
    }
    if (this.pointer !== null) {
      snapshot.pointer = this.pointer;
    }
  }

  /** Forgets every held button. The pointer position stays: it is not "held". */
  public releaseAll(): void {
    this.buttons = 0;
  }

  private readonly onPointer = (event: Event): void => {
    const pointerEvent = event as PointerEvent;
    this.buttons = pointerEvent.buttons;
    this.pointer = { x: pointerEvent.offsetX, y: pointerEvent.offsetY };
    if (pointerEvent.button > MAIN_BUTTON) {
      pointerEvent.preventDefault();
    }
    const host = pointerEvent.currentTarget;
    if (pointerEvent.type === 'pointerdown' && host !== null && 'setPointerCapture' in host) {
      (host as Element).setPointerCapture(pointerEvent.pointerId);
    }
  };

  private readonly onCancel = (): void => {
    this.releaseAll();
  };

  private static readonly suppress = (event: Event): void => {
    event.preventDefault();
  };
}
