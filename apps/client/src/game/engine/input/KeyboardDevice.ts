import type { InputDevice, MutableInputSnapshot } from './InputDevice.types';
import { NEVER_PREVENTED_CODES } from './KeyboardDevice.constants';

const isKeyboardEvent = (event: Event): event is KeyboardEvent => 'code' in event && 'key' in event;

/**
 * The keyboard (architecture 09 §2). Keys are tracked by `KeyboardEvent.code`, the physical key,
 * so bindings work on any layout; `KeyboardEvent.key` is kept as the label. Auto-repeat is ignored.
 * The browser's default is cancelled only for bound keys, and never for Tab, F5, F12 or Ctrl/Meta
 * chords.
 */
export class KeyboardDevice implements InputDevice {
  private readonly held = new Map<string, string>();

  private target: EventTarget | null = null;

  /**
   * Creates a detached keyboard.
   *
   * @param isBound - Whether a key code is bound to an action (its default gets cancelled).
   */
  public constructor(private readonly isBound: (code: string) => boolean) {}

  /** Starts listening to key presses on `target` (normally `window`). */
  public attach(target: EventTarget): void {
    this.detach();
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    this.target = target;
  }

  /** Stops listening and forgets every held key. */
  public detach(): void {
    this.target?.removeEventListener('keydown', this.onKeyDown);
    this.target?.removeEventListener('keyup', this.onKeyUp);
    this.target = null;
    this.releaseAll();
  }

  /** Adds the held keys and their labels to `snapshot`. */
  public writeInto(snapshot: MutableInputSnapshot): void {
    for (const [code, label] of this.held) {
      snapshot.keys.add(code);
      snapshot.keyLabels.set(code, label);
    }
  }

  /** Forgets every held key. */
  public releaseAll(): void {
    this.held.clear();
  }

  private readonly onKeyDown = (event: Event): void => {
    if (!isKeyboardEvent(event)) {
      return;
    }
    const code = KeyboardDevice.codeOf(event);
    if (this.shouldPrevent(event, code)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      this.held.set(code, event.key);
    }
  };

  private readonly onKeyUp = (event: Event): void => {
    if (isKeyboardEvent(event)) {
      this.held.delete(KeyboardDevice.codeOf(event));
    }
  };

  private shouldPrevent(event: KeyboardEvent, code: string): boolean {
    return (
      this.isBound(code) && !event.ctrlKey && !event.metaKey && !NEVER_PREVENTED_CODES.has(code)
    );
  }

  /** Mobile virtual keyboards send an empty `code`; the key is the best stand-in. */
  private static codeOf(event: KeyboardEvent): string {
    return event.code === '' ? event.key : event.code;
  }
}
