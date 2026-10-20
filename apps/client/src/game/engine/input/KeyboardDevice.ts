import type { InputDevice, MutableInputSnapshot } from './InputDevice.types';
import { FOCUS_LOSS_EVENTS, NEVER_PREVENTED_CODES } from './KeyboardDevice.constants';

/**
 * The keyboard adapter. Tracks held keys by `KeyboardEvent.code` (the physical key, so
 * bindings survive keyboard layouts), ignores auto-repeat, prevents the browser default only
 * for bound keys, and releases everything when the window loses focus or is hidden.
 */
export class KeyboardDevice implements InputDevice {
  private readonly held = new Set<string>();
  private readonly isBound: (code: string) => boolean;
  private target: EventTarget | null = null;

  /** `isBound` says which codes the game uses; only those have their browser default prevented. */
  public constructor(isBound: (code: string) => boolean) {
    this.isBound = isBound;
  }

  /** Starts listening to key and focus events on `target`, normally `window`. */
  public attach(target: EventTarget): void {
    this.detach();
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    FOCUS_LOSS_EVENTS.forEach((type) => {
      target.addEventListener(type, this.onFocusLost);
    });
    this.target = target;
  }

  /** Stops listening and releases every key. */
  public detach(): void {
    const target = this.target;
    if (target !== null) {
      target.removeEventListener('keydown', this.onKeyDown);
      target.removeEventListener('keyup', this.onKeyUp);
      FOCUS_LOSS_EVENTS.forEach((type) => {
        target.removeEventListener(type, this.onFocusLost);
      });
      this.target = null;
    }
    this.releaseAll();
  }

  /** Adds the held key codes to `snapshot`. */
  public writeInto(snapshot: MutableInputSnapshot): void {
    this.held.forEach((code) => snapshot.keys.add(code));
  }

  /** Forgets every held key. */
  public releaseAll(): void {
    this.held.clear();
  }

  private readonly onKeyDown = (event: Event): void => {
    const keyEvent = event as KeyboardEvent;
    const code = KeyboardDevice.codeOf(keyEvent);
    const isBrowserShortcut =
      NEVER_PREVENTED_CODES.includes(code) || keyEvent.ctrlKey || keyEvent.metaKey;
    if (this.isBound(code) && !isBrowserShortcut) {
      keyEvent.preventDefault();
    }
    if (!keyEvent.repeat) {
      this.held.add(code);
    }
  };

  private readonly onKeyUp = (event: Event): void => {
    this.held.delete(KeyboardDevice.codeOf(event as KeyboardEvent));
  };

  private readonly onFocusLost = (): void => {
    this.releaseAll();
  };

  /** Mobile virtual keyboards report an empty `code`; fall back to `key` for them. */
  private static codeOf(event: KeyboardEvent): string {
    return event.code === '' ? event.key : event.code;
  }
}
