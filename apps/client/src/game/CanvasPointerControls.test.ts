import { describe, expect, it, vi } from 'vitest';

import { CanvasPointerControls } from './CanvasPointerControls';
import { CLICK_SLOP } from './CanvasPointerControls.constants';
import { syntheticEvent } from './engine/input/InputDevice.contract';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';
import type { ViewportChrome } from './MatchViewport.types';

/** A chrome that records the interior and explorer flags and keeps the actions it is given. */
function recordingChrome() {
  const actions: { leave: (() => void) | null; overview: (() => void) | null } = {
    leave: null,
    overview: null,
  };
  const interior: boolean[] = [];
  const explorer: boolean[] = [];
  const chrome: ViewportChrome = {
    onInteriorChanged: (isInside) => interior.push(isInside),
    onExplorerChanged: (isShown) => explorer.push(isShown),
    setLeaveInterior: (run) => {
      actions.leave = run;
    },
    setOverview: (run) => {
      actions.overview = run;
    },
  };
  return { chrome, actions, interior, explorer };
}

/** A 640 × 360 CSS-pixel canvas with twice as many device pixels, under the controls. */
function setUp(isExplorerShown: boolean) {
  const canvas = new FakeViewportCanvas(640, 360);
  canvas.width = 1280;
  canvas.height = 720;
  const { chrome, actions, interior, explorer } = recordingChrome();
  const match = {
    lookAtMinimapPoint: vi.fn<(x: number, y: number) => boolean>(() => false),
    panBy: vi.fn(),
    zoomBy: vi.fn(),
    enterAt: vi.fn<(x: number, y: number) => boolean>(() => true),
    overview: vi.fn(),
    leaveInterior: vi.fn(),
  };
  const controls = new CanvasPointerControls({
    match,
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
  return { canvas, actions, interior, explorer, match, controls, pointer, click };
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

  it('enters the cathedral on a short click on it and reports the interior', () => {
    const { interior, match, click } = setUp(false);
    click(100, 50);
    expect(match.enterAt).toHaveBeenCalledWith(200, 100);
    expect(interior).toEqual([true]);
  });

  it('neither enters nor pans after a press that moved past the click slop', () => {
    const { interior, match, click } = setUp(false);
    click(100, 50, CLICK_SLOP);
    expect(match.enterAt).not.toHaveBeenCalled();
    expect(match.panBy).not.toHaveBeenCalled();
    expect(interior).toEqual([]);
  });

  it('leaves the cathedral through the chrome action', () => {
    const { actions, interior, match } = setUp(false);
    actions.leave?.();
    expect(match.leaveInterior).toHaveBeenCalledTimes(1);
    expect(interior).toEqual([false]);
  });

  it('ignores every button but the main one', () => {
    const { canvas, match, pointer } = setUp(false);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50, 2));
    canvas.dispatchEvent(pointer('pointerup', 100, 50, 2));
    expect(match.lookAtMinimapPoint).not.toHaveBeenCalled();
    expect(match.enterAt).not.toHaveBeenCalled();
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
    expect(match.enterAt).not.toHaveBeenCalled();
  });

  it('still enters the cathedral on a short click', () => {
    const { interior, click } = setUp(true);
    click(100, 50, 1);
    expect(interior).toEqual([true]);
  });

  it('zooms on the wheel and keeps the page from scrolling', () => {
    const { canvas, match } = setUp(true);
    const wheel = syntheticEvent('wheel', { deltaY: 100 });
    canvas.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(match.zoomBy).toHaveBeenCalledWith(Math.exp(-100 * EXPLORER_SETTINGS.wheelSensitivity));
  });

  it('shows the world overview through the chrome action', () => {
    const { actions, interior, match } = setUp(true);
    actions.overview?.();
    expect(match.overview).toHaveBeenCalledTimes(1);
    expect(interior).toEqual([false]);
  });

  it('forgets a drag on cancel', () => {
    const { canvas, match, controls, pointer } = setUp(true);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    controls.cancelDrag();
    canvas.dispatchEvent(pointer('pointermove', 150, 50));
    canvas.dispatchEvent(pointer('pointerup', 100, 50));
    expect(match.panBy).not.toHaveBeenCalled();
    expect(match.enterAt).not.toHaveBeenCalled();
  });

  it('removes every listener and takes the chrome actions back on detach', () => {
    const { canvas, actions, controls } = setUp(true);
    expect(canvas.listenerCount()).toBe(5);
    controls.detach();
    expect(canvas.listenerCount()).toBe(0);
    expect(actions).toEqual({ leave: null, overview: null });
  });
});

describe('CanvasPointerControls on the developer camera hotkey (DEC-105)', () => {
  it('shows the explorer in normal play: drag, wheel and overview work, the chrome is told', () => {
    const { canvas, actions, explorer, match, controls, pointer } = setUp(false);

    controls.toggleExplorer();

    expect(explorer).toEqual([true]);
    expect(canvas.listenerCount()).toBe(5);
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    expect(canvas.hasPointerCapture(7)).toBe(true);
    canvas.dispatchEvent(pointer('pointermove', 110, 45));
    expect(match.panBy).toHaveBeenCalledWith(20, -10);
    canvas.dispatchEvent(syntheticEvent('wheel', { deltaY: 100 }));
    expect(match.zoomBy).toHaveBeenCalledTimes(1);
    actions.overview?.();
    expect(match.overview).toHaveBeenCalledTimes(1);
  });

  it('hides it again: no drag, wheel or overview, the chrome is told', () => {
    const { canvas, actions, explorer, match, controls, pointer } = setUp(true);

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
  });

  it('leaves 0 listeners on detach after a toggle', () => {
    const { canvas, actions, controls } = setUp(false);
    controls.toggleExplorer();
    controls.detach();
    expect(canvas.listenerCount()).toBe(0);
    expect(actions).toEqual({ leave: null, overview: null });
  });
});
