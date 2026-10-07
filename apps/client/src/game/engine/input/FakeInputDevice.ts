import type { InputDevice, MutableInputSnapshot, PointerPosition } from './InputDevice.types';

/**
 * A scriptable `InputDevice` for tests: `press('KeyW')`, `pressButton(3)`, `movePointer(…)`.
 * Like a real device it only reports input while attached.
 */
export class FakeInputDevice implements InputDevice {
  private readonly keys = new Set<string>();
  private readonly buttons = new Set<number>();
  private pointer: PointerPosition | null = null;
  private isAttached = false;

  /** Starts reporting input. The target is ignored. */
  public attach(): void {
    this.isAttached = true;
  }

  /** Stops reporting input and releases everything. */
  public detach(): void {
    this.isAttached = false;
    this.releaseAll();
  }

  /** Holds the key with this `KeyboardEvent.code`. */
  public press(code: string): void {
    if (this.isAttached) {
      this.keys.add(code);
    }
  }

  /** Lets go of the key with this `KeyboardEvent.code`. */
  public release(code: string): void {
    this.keys.delete(code);
  }

  /** Holds the mouse button with this `MouseEvent.button`. */
  public pressButton(button: number): void {
    if (this.isAttached) {
      this.buttons.add(button);
    }
  }

  /** Lets go of the mouse button with this `MouseEvent.button`. */
  public releaseButton(button: number): void {
    this.buttons.delete(button);
  }

  /** Moves the pointer to `position` (CSS pixels on the target). */
  public movePointer(position: PointerPosition): void {
    if (this.isAttached) {
      this.pointer = position;
    }
  }

  /** Adds the held keys, buttons and the pointer to `snapshot`. */
  public writeInto(snapshot: MutableInputSnapshot): void {
    this.keys.forEach((code) => snapshot.keys.add(code));
    this.buttons.forEach((button) => snapshot.mouseButtons.add(button));
    if (this.pointer !== null) {
      snapshot.pointer = this.pointer;
    }
  }

  /** Forgets every held key and button. */
  public releaseAll(): void {
    this.keys.clear();
    this.buttons.clear();
  }
}
