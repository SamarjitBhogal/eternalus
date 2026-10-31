import type { InputAction } from '../bridge/Binding.types';
import { CanvasPointerControls } from './CanvasPointerControls';
import type { MatchHostDeps } from './MatchHost.types';
import type { RunningMatch } from './SessionController.types';

/**
 * Hosts one match in the page: sizes the canvas to its device pixels, attaches the keyboard to
 * the window and the mouse and pointer controls to the canvas, follows the player's bindings,
 * releases held input on focus loss, a hidden tab or pause, runs the client-only one-shot actions
 * on their key press (DEC-117; the developer explorer's hotkey, DEC-105, every build), and tears
 * all of it down again, leaving 0 listeners and 0 frames (13 §2). It owns the match and the
 * adapters it is given.
 */
export class MatchHost implements RunningMatch {
  private readonly pointer: CanvasPointerControls;

  private stopSettings = (): void => undefined;

  private isDestroyed = false;

  /**
   * The client-only one-shot actions and what each does: matched on a key press with exactly its
   * chord's modifiers, never held, and read while paused too (DEC-117). A new one is one entry.
   */
  private readonly oneShotActions: readonly (readonly [InputAction, () => void])[] = [
    [
      'toggle-developer-camera',
      () => {
        this.pointer.toggleExplorer();
      },
    ],
  ];

  /** Creates the host; nothing listens until `start()`. */
  public constructor(private readonly deps: MatchHostDeps) {
    this.pointer = new CanvasPointerControls({ match: deps.match, viewport: deps.viewport });
  }

  /**
   * Sizes the canvas, attaches the listeners and devices, follows the bindings, then starts the
   * match. On a throw it undoes everything (`destroy`) and rethrows.
   */
  public start(): void {
    const { match, viewport, window, document, keyboard, mouse, bus, mapper } = this.deps;
    try {
      this.resize();
      window.addEventListener('resize', this.resize);
      window.addEventListener('blur', this.releaseInput);
      window.addEventListener('keydown', this.runOneShotAction);
      document.addEventListener('visibilitychange', this.releaseInputWhenHidden);
      keyboard.attach(window);
      mouse.attach(viewport.canvas);
      this.pointer.attach();
      this.stopSettings = bus.on('settings', ({ bindings }) => {
        mapper.setBindings(bindings);
      });
      match.start();
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  /**
   * Pauses (and releases held input) or resumes the match (13 §7; held input released on pause:
   * INBOX HC-Q8).
   */
  public setPaused(isPaused: boolean): void {
    this.deps.match.setPaused(isPaused);
    if (isPaused) {
      this.releaseInput();
    }
  }

  /** Removes every listener, detaches the devices, destroys the match, then its adapters. Safe twice. */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    const { match, window, document, keyboard, mouse, adapters } = this.deps;
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('blur', this.releaseInput);
    window.removeEventListener('keydown', this.runOneShotAction);
    document.removeEventListener('visibilitychange', this.releaseInputWhenHidden);
    keyboard.detach();
    mouse.detach();
    this.pointer.detach();
    this.stopSettings();
    match.destroy();
    for (const adapter of adapters) {
      adapter.destroy();
    }
  }

  private readonly resize = (): void => {
    const { match, viewport, window } = this.deps;
    const { canvas } = viewport;
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.round(canvas.clientWidth * pixelRatio);
    canvas.height = Math.round(canvas.clientHeight * pixelRatio);
    match.resize(canvas.width, canvas.height, pixelRatio);
  };

  /** No key-up arrives for keys held while the tab loses focus, so release them all (09 §2). */
  private readonly releaseInput = (): void => {
    this.deps.input.releaseAll();
    this.pointer.cancelDrag();
  };

  /** A press (not a repeat) of a one-shot action's chord runs that action (DEC-117). */
  private readonly runOneShotAction = (event: Event): void => {
    const key = event as KeyboardEvent;
    if (key.repeat) return;
    const entry = this.oneShotActions.find(([action]) => this.deps.mapper.isActionKey(action, key));
    if (entry === undefined) return;
    key.preventDefault();
    entry[1]();
  };

  private readonly releaseInputWhenHidden = (): void => {
    if (this.deps.document.hidden) {
      this.deps.input.releaseAll();
    }
  };
}
