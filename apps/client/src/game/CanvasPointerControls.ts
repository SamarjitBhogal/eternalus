import { CLICK_SLOP } from './CanvasPointerControls.constants';
import type { CanvasPointerControlsDeps } from './CanvasPointerControls.types';
import { MAIN_BUTTON } from './engine/input/mouseButtons.constants';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';

/**
 * The match canvas's pointer gestures. Always: a main-button click on the minimap moves the
 * camera there, a short click on the cathedral steps inside (DEC-32), and the chrome's Leave
 * cathedral action steps out (DEC-32, CD-22). With the developer explorer only (on at the start
 * with `?dev=1`, then shown or hidden by DEC-105's hotkey; demo-only by DEC-32, INBOX HC-F8):
 * drag to pan, the wheel to zoom, and the toolbar's world overview. Positions arrive in CSS pixels
 * and reach the match in device pixels.
 */
export class CanvasPointerControls {
  private press: { x: number; y: number; distance: number } | null = null;

  private isExplorerShown: boolean;

  /** Creates the controls; nothing listens until `attach()`. */
  public constructor(private readonly deps: CanvasPointerControlsDeps) {
    this.isExplorerShown = deps.viewport.isExplorerShown;
  }

  /** Listens for clicks and gives the chrome its actions; with the explorer, drags and the wheel too. */
  public attach(): void {
    const { match, viewport } = this.deps;
    const { canvas, chrome } = viewport;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    chrome.setLeaveInterior(() => {
      match.leaveInterior();
      chrome.onInteriorChanged(false);
    });
    if (this.isExplorerShown) {
      this.attachExplorer();
    }
  }

  /** Removes every listener and takes the chrome's actions back. */
  public detach(): void {
    const { canvas, chrome } = this.deps.viewport;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    this.detachExplorer();
    chrome.setLeaveInterior(null);
    this.press = null;
  }

  /**
   * Shows the developer explorer (its drag, wheel and overview) or hides it, and tells the chrome
   * (DEC-105's hotkey). Call it only while attached.
   */
  public toggleExplorer(): void {
    this.isExplorerShown = !this.isExplorerShown;
    if (this.isExplorerShown) {
      this.attachExplorer();
    } else {
      this.detachExplorer();
    }
    this.deps.viewport.chrome.onExplorerChanged(this.isExplorerShown);
  }

  /** Forgets a press or drag in progress (focus lost, pointer cancelled). */
  public readonly cancelDrag = (): void => {
    this.press = null;
  };

  private attachExplorer(): void {
    const { match, viewport } = this.deps;
    const { canvas, chrome } = viewport;
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointercancel', this.cancelDrag);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    chrome.setOverview(() => {
      match.overview();
      chrome.onInteriorChanged(false);
    });
  }

  private detachExplorer(): void {
    const { canvas, chrome } = this.deps.viewport;
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointercancel', this.cancelDrag);
    canvas.removeEventListener('wheel', this.onWheel);
    chrome.setOverview(null);
  }

  private readonly onPointerDown = (event: Event): void => {
    const pointer = event as PointerEvent;
    if (pointer.button !== MAIN_BUTTON) {
      return;
    }
    const point = this.devicePoint(pointer);
    if (this.deps.match.lookAtMinimapPoint(point.x, point.y)) {
      return;
    }
    this.press = { x: pointer.clientX, y: pointer.clientY, distance: 0 };
    if (this.isExplorerShown) {
      this.deps.viewport.canvas.setPointerCapture(pointer.pointerId);
    }
  };

  private readonly onPointerMove = (event: Event): void => {
    const pointer = event as PointerEvent;
    if (this.press === null) {
      return;
    }
    const { canvas } = this.deps.viewport;
    const dx = pointer.clientX - this.press.x;
    const dy = pointer.clientY - this.press.y;
    this.deps.match.panBy(
      dx * (canvas.width / canvas.clientWidth),
      dy * (canvas.height / canvas.clientHeight),
    );
    this.press = {
      x: pointer.clientX,
      y: pointer.clientY,
      distance: this.press.distance + Math.hypot(dx, dy),
    };
  };

  private readonly onPointerUp = (event: Event): void => {
    const pointer = event as PointerEvent;
    const { press } = this;
    this.press = null;
    const { canvas, chrome } = this.deps.viewport;
    if (canvas.hasPointerCapture(pointer.pointerId)) {
      canvas.releasePointerCapture(pointer.pointerId);
    }
    if (press === null) {
      return;
    }
    const distance =
      press.distance + Math.hypot(pointer.clientX - press.x, pointer.clientY - press.y);
    const point = this.devicePoint(pointer);
    if (distance < CLICK_SLOP && this.deps.match.enterAt(point.x, point.y)) {
      chrome.onInteriorChanged(true);
    }
  };

  private readonly onWheel = (event: Event): void => {
    const wheel = event as WheelEvent;
    wheel.preventDefault();
    this.deps.match.zoomBy(Math.exp(-wheel.deltaY * EXPLORER_SETTINGS.wheelSensitivity));
  };

  /** A pointer position in the canvas's device pixels (the canvas may have more real pixels). */
  private devicePoint(event: PointerEvent): { x: number; y: number } {
    const { canvas } = this.deps.viewport;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
      y: ((event.clientY - bounds.top) * canvas.height) / bounds.height,
    };
  }
}
