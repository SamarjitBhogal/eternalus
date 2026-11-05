import { describe, expect, it, vi } from 'vitest';

import { CanvasPointerControls } from './CanvasPointerControls';
import { CLICK_SLOP } from './CanvasPointerControls.constants';
import { syntheticEvent } from './engine/input/InputDevice.contract';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';
import type { ViewportChrome } from './MatchViewport.types';

/** A chrome that records the roof and explorer flags and keeps the action it is given. */
function recordingChrome() {
  const actions: { overview: (() => void) | null } = { overview: null };
  const roofs: boolean[] = [];
  const explorer: boolean[] = [];
  const chrome: ViewportChrome = {
    onDeveloperRoofsChanged: (hasDeveloperRoofs) => roofs.push(hasDeveloperRoofs),
    onExplorerChanged: (isShown) => explorer.push(isShown),
    setOverview: (run) => {
      actions.overview = run;
    },
  };
  return { chrome, actions, roofs, explorer };
}

/** A 640 × 360 CSS-pixel canvas with twice as many device pixels, under the controls. */
function setUp(isExplorerShown: boolean) {
  const canvas = new FakeViewportCanvas(640, 360);
  canvas.width = 1280;
  canvas.height = 720;
  const { chrome, actions, roofs, explorer } = recordingChrome();
  // Every click lands on the same building: the first cuts its roof away, the next puts it back.
  const match = {
    lookAtMinimapPoint: vi.fn<(x: number, y: number) => boolean>(() => false),
    panBy: vi.fn(),
    zoomBy: vi.fn(),
    hasDeveloperRoofs: false,
    attackAt: vi.fn<(x: number, y: number) => void>(),
    toggleRoofAt: vi.fn<(x: number, y: number) => boolean>(() => {
      match.hasDeveloperRoofs = !match.hasDeveloperRoofs;
      return true;
    }),
    overview: vi.fn(),
    leaveExplorer: vi.fn(),
    setPointerClaimed: vi.fn(),
  };
  const controls = new CanvasPointerControls({
    controls: match,
    viewport: { canvas, chrome, isExplorerShown },
  });
  controls.attach();
  const pointer = (type: string, x: number, y: number, button = 0): Event =>
    syntheticEvent(type, { button, clientX: x, clientY: y, pointerId: 7 });
  /** A main-button press at (x, y) and a release at (x + dx, y). */
  const click = (x: number, y: number, dx = 0): void => {
    canvas.dispatchEvent(pointer('pointerdown', x, y));
    canvas.dispatchEvent(pointer('pointerup', x + dx, y));
  };
  return { canvas, actions, roofs, explorer, match, controls, pointer, click };
}

describe('CanvasPointerControls in normal play', () => {
  it('listens only for presses and releases', () => {
    const { canvas, actions } = setUp(false);
    expect(canvas.listenerCount('pointerdown')).toBe(1);
    expect(canvas.listenerCount('pointerup')).toBe(1);
    expect(canvas.listenerCount()).toBe(2);
    expect(actions.overview).toBeNull();
  });

  it('moves the camera on a minimap click, in device pixels', () => {
    const { canvas, match, pointer } = setUp(false);
    match.lookAtMinimapPoint.mockReturnValue(true);
    canvas.dispatchEvent(pointer('pointerdown', 600, 40));
    expect(match.lookAtMinimapPoint).toHaveBeenCalledWith(1200, 80);
    expect(match.panBy).not.toHaveBeenCalled();
  });

  it('claims a minimap press until its release, so the attack button does not act on it', () => {
    const { canvas, match, pointer } = setUp(false);
    match.lookAtMinimapPoint.mockReturnValue(true);

    canvas.dispatchEvent(pointer('pointerdown', 600, 40));
    expect(match.setPointerClaimed).toHaveBeenLastCalledWith(true);
    canvas.dispatchEvent(pointer('pointerup', 600, 40));

    expect(match.setPointerClaimed).toHaveBeenLastCalledWith(false);
  });

  it('lets a press on the world attack after a minimap press that ended in a cancel', () => {
    const { canvas, match, pointer } = setUp(false);
    match.lookAtMinimapPoint.mockReturnValueOnce(true);
    canvas.dispatchEvent(pointer('pointerdown', 600, 40));
    // Normal play does not listen for `pointercancel`: no release reaches the controls.
    canvas.dispatchEvent(pointer('pointercancel', 600, 40));

    canvas.dispatchEvent(pointer('pointerdown', 100, 50));

    expect(match.setPointerClaimed).toHaveBeenLastCalledWith(false);
  });

  it('leaves a press off the minimap to the attack button', () => {
    const { match, click } = setUp(false);
    click(100, 50);
    expect(match.setPointerClaimed).not.toHaveBeenCalledWith(true);
  });

  it('never toggles a roof on a click: roofs open only when the Legend enters (DEC-143)', () => {
    const { roofs, match, click } = setUp(false);
    click(100, 50);
    expect(match.toggleRoofAt).not.toHaveBeenCalled();
    expect(roofs).toEqual([]);
  });

  it('attacks on no release: the held attack button does (DEC-150)', () => {
    const { match, click } = setUp(false);
    match.toggleRoofAt.mockReturnValue(false);
    click(100, 50);
    expect(match.attackAt).not.toHaveBeenCalled();
  });

  it('ignores every button but the main one', () => {
    const { canvas, match, pointer } = setUp(false);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50, 2));
    canvas.dispatchEvent(pointer('pointerup', 100, 50, 2));
    expect(match.lookAtMinimapPoint).not.toHaveBeenCalled();
    expect(match.toggleRoofAt).not.toHaveBeenCalled();
  });
});

describe('CanvasPointerControls with the developer explorer', () => {
  it('pans by the drag in device pixels and captures the pointer', () => {
    const { canvas, match, pointer } = setUp(true);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    expect(canvas.hasPointerCapture(7)).toBe(true);
    canvas.dispatchEvent(pointer('pointermove', 110, 45));
    expect(match.panBy).toHaveBeenCalledWith(20, -10);
    canvas.dispatchEvent(pointer('pointerup', 110, 45));
    expect(canvas.hasPointerCapture(7)).toBe(false);
    expect(match.toggleRoofAt).not.toHaveBeenCalled();
  });

  it('toggles the roof under a short click and reports whether a roof is still open', () => {
    const { roofs, match, click } = setUp(true);
    click(100, 50);
    expect(match.toggleRoofAt).toHaveBeenCalledWith(200, 100);
    click(100, 50);
    expect(roofs).toEqual([true, false]);
  });

  it('claims every press from pointerdown to release or cancel: no held attack (DEC-150)', () => {
    const { canvas, match, pointer, controls } = setUp(true);

    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    expect(match.setPointerClaimed).toHaveBeenLastCalledWith(true);
    canvas.dispatchEvent(pointer('pointermove', 100 + CLICK_SLOP - 1, 50));
    expect(match.setPointerClaimed).toHaveBeenCalledTimes(1);
    canvas.dispatchEvent(pointer('pointerup', 100 + CLICK_SLOP - 1, 50));
    expect(match.setPointerClaimed).toHaveBeenLastCalledWith(false);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    expect(match.setPointerClaimed).toHaveBeenLastCalledWith(true);
    controls.cancelDrag();

    expect(match.setPointerClaimed).toHaveBeenLastCalledWith(false);
  });

  it('attacks once at the release point on a click off every building (DEC-150)', () => {
    const { roofs, match, click } = setUp(true);
    match.toggleRoofAt.mockReturnValue(false);

    click(100, 50, CLICK_SLOP - 1);

    expect(match.toggleRoofAt).toHaveBeenCalledWith(208, 100);
    expect(match.attackAt).toHaveBeenCalledTimes(1);
    expect(match.attackAt).toHaveBeenCalledWith(208, 100);
    expect(roofs).toEqual([]);
  });

  it('does not attack on a roof click (DEC-150)', () => {
    const { roofs, match, click } = setUp(true);
    click(100, 50);
    expect(roofs).toEqual([true]);
    expect(match.attackAt).not.toHaveBeenCalled();
  });

  it('neither toggles a roof nor pans after a press that moved past the click slop', () => {
    const { roofs, match, canvas, pointer } = setUp(true);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    canvas.dispatchEvent(pointer('pointerup', 100 + CLICK_SLOP, 50));
    expect(match.toggleRoofAt).not.toHaveBeenCalled();
    expect(roofs).toEqual([]);
  });

  it('neither toggles a roof nor attacks after a drag past the click slop (DEC-150)', () => {
    const { roofs, match, canvas, pointer } = setUp(true);
    match.toggleRoofAt.mockReturnValue(false);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    canvas.dispatchEvent(pointer('pointermove', 100 + CLICK_SLOP, 50));
    canvas.dispatchEvent(pointer('pointerup', 100 + CLICK_SLOP, 50));
    expect(match.toggleRoofAt).not.toHaveBeenCalled();
    expect(match.attackAt).not.toHaveBeenCalled();
    expect(roofs).toEqual([]);
  });

  it('claims a minimap press and moves the camera, with no attack or roof (DEC-150)', () => {
    const { canvas, match, pointer } = setUp(true);
    match.lookAtMinimapPoint.mockReturnValue(true);
    canvas.dispatchEvent(pointer('pointerdown', 600, 40));
    expect(match.setPointerClaimed).toHaveBeenLastCalledWith(true);
    canvas.dispatchEvent(pointer('pointerup', 600, 40));
    expect(match.lookAtMinimapPoint).toHaveBeenCalledWith(1200, 80);
    expect(match.toggleRoofAt).not.toHaveBeenCalled();
    expect(match.attackAt).not.toHaveBeenCalled();
  });

  it('zooms on the wheel and keeps the page from scrolling', () => {
    const { canvas, match } = setUp(true);
    const wheel = syntheticEvent('wheel', { deltaY: 100 });
    canvas.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(match.zoomBy).toHaveBeenCalledWith(Math.exp(-100 * EXPLORER_SETTINGS.wheelSensitivity));
  });

  it('shows the world overview through the chrome action and reports every roof on', () => {
    const { actions, roofs, match } = setUp(true);
    actions.overview?.();
    expect(match.overview).toHaveBeenCalledTimes(1);
    expect(roofs).toEqual([false]);
  });

  it('forgets a drag on cancel', () => {
    const { canvas, match, controls, pointer } = setUp(true);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    controls.cancelDrag();
    canvas.dispatchEvent(pointer('pointermove', 150, 50));
    canvas.dispatchEvent(pointer('pointerup', 100, 50));
    expect(match.panBy).not.toHaveBeenCalled();
    expect(match.toggleRoofAt).not.toHaveBeenCalled();
  });

  it('removes every listener and takes the chrome actions back on detach', () => {
    const { canvas, actions, controls } = setUp(true);
    expect(canvas.listenerCount()).toBe(5);
    controls.detach();
    expect(canvas.listenerCount()).toBe(0);
    expect(actions).toEqual({ overview: null });
  });
});

describe('CanvasPointerControls on the developer camera hotkey (DEC-105)', () => {
  it('shows the explorer in normal play: drag, wheel, roof click and overview work, the chrome is told', () => {
    const { canvas, actions, explorer, match, controls, pointer, click } = setUp(false);

    controls.toggleExplorer();

    expect(explorer).toEqual([true]);
    expect(canvas.listenerCount()).toBe(5);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    expect(canvas.hasPointerCapture(7)).toBe(true);
    canvas.dispatchEvent(pointer('pointermove', 110, 45));
    expect(match.panBy).toHaveBeenCalledWith(20, -10);
    canvas.dispatchEvent(syntheticEvent('wheel', { deltaY: 100 }));
    expect(match.zoomBy).toHaveBeenCalledTimes(1);
    canvas.dispatchEvent(pointer('pointerup', 110, 45));
    click(300, 50);
    expect(match.toggleRoofAt).toHaveBeenCalledWith(600, 100);
    actions.overview?.();
    expect(match.overview).toHaveBeenCalledTimes(1);
    expect(match.leaveExplorer).not.toHaveBeenCalled();
  });

  it('hides it again: no drag, wheel, overview or roof click, the chrome is told', () => {
    const { canvas, actions, explorer, match, controls, pointer, click } = setUp(true);

    controls.toggleExplorer();

    expect(explorer).toEqual([false]);
    expect(canvas.listenerCount()).toBe(2);
    expect(actions.overview).toBeNull();
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    expect(canvas.hasPointerCapture(7)).toBe(false);
    canvas.dispatchEvent(pointer('pointermove', 110, 45));
    canvas.dispatchEvent(syntheticEvent('wheel', { deltaY: 100 }));
    expect(match.panBy).not.toHaveBeenCalled();
    expect(match.zoomBy).not.toHaveBeenCalled();
    click(100, 50);
    expect(match.toggleRoofAt).not.toHaveBeenCalled();
  });

  it('puts back the roofs the developer opened and the following camera when it hides (DEC-143)', () => {
    const { roofs, match, controls, click } = setUp(true);
    click(100, 50);
    expect(roofs).toEqual([true]);

    controls.toggleExplorer();

    expect(match.leaveExplorer).toHaveBeenCalledTimes(1);
    expect(roofs).toEqual([true, false]);
  });

  it('leaves 0 listeners on detach after a toggle', () => {
    const { canvas, actions, controls } = setUp(false);
    controls.toggleExplorer();
    controls.detach();
    expect(canvas.listenerCount()).toBe(0);
    expect(actions).toEqual({ overview: null });
  });
});
