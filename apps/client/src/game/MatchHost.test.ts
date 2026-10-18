import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { KeyboardDevice } from './engine/input/KeyboardDevice';
import { MouseDevice } from './engine/input/MouseDevice';
import { FakeBrowserTarget } from './FakeBrowserTarget';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { PRESETS } from './input/keybindings';
import { MatchHost } from './MatchHost';
import { settingsWithDefaults } from './settings/settingsState';

/** A host over fakes, with a stub match and adapters that log their calls in order. */
function setUp(options: { readonly isStartThrowing?: boolean } = {}) {
  const window = new FakeBrowserTarget();
  window.devicePixelRatio = 2;
  const document = new FakeBrowserTarget();
  const canvas = new FakeViewportCanvas(640, 360);
  const bus = new TypedEventBus<BridgeEventMap>();
  const log: string[] = [];
  const atStart = { windowListeners: 0, canvasListeners: 0, busListeners: 0 };
  const match = {
    start: vi.fn(() => {
      log.push('match.start');
      atStart.windowListeners = window.listenerCount();
      atStart.canvasListeners = canvas.listenerCount();
      atStart.busListeners = bus.listenerCount();
      if (options.isStartThrowing === true) throw new Error('start failed');
    }),
    destroy: vi.fn(() => log.push('match.destroy')),
    resize: vi.fn(),
    setPaused: vi.fn(),
    lookAtMinimapPoint: vi.fn(() => false),
    panBy: vi.fn(),
    zoomBy: vi.fn(),
    enterAt: vi.fn(() => false),
    overview: vi.fn(),
    leaveInterior: vi.fn(),
  };
  const input = { releaseAll: vi.fn() };
  const mapper = { setBindings: vi.fn() };
  const adapters = ['renderer', 'camera'].map((name) => ({
    destroy: vi.fn(() => log.push(`${name}.destroy`)),
  }));
  const chrome = { onInteriorChanged: vi.fn(), setLeaveInterior: vi.fn(), setOverview: vi.fn() };
  const host = new MatchHost({
    match,
    viewport: { canvas, chrome, isExplorerShown: false },
    window,
    document,
    keyboard: new KeyboardDevice(() => true),
    mouse: new MouseDevice(),
    input,
    bus,
    mapper,
    adapters,
  });
  const listeners = (): number =>
    window.listenerCount() + document.listenerCount() + canvas.listenerCount();
  return { host, window, document, canvas, bus, log, atStart, match, input, mapper, listeners };
}

describe('MatchHost', () => {
  it('sizes the canvas in device pixels, attaches everything, then starts the match', () => {
    const { host, canvas, bus, match, atStart } = setUp();
    const busBefore = bus.listenerCount();
    host.start();

    expect([canvas.width, canvas.height]).toEqual([1280, 720]);
    expect(match.resize).toHaveBeenCalledWith(1280, 720, 2);
    expect(match.start).toHaveBeenCalledTimes(1);
    expect(atStart.windowListeners).toBeGreaterThan(0);
    expect(atStart.canvasListeners).toBeGreaterThan(0);
    expect(atStart.busListeners).toBe(busBefore + 1);
  });

  it('attaches the keyboard to the window and the mouse to the canvas', () => {
    const { host, window, canvas } = setUp();
    host.start();
    expect(window.listenerCount('keydown')).toBe(1);
    expect(canvas.listenerCount('pointermove')).toBe(1);
  });

  it('resizes again when the window resizes', () => {
    const { host, window, canvas, match } = setUp();
    host.start();
    window.devicePixelRatio = 1;
    window.dispatchEvent(new Event('resize'));
    expect([canvas.width, canvas.height]).toEqual([640, 360]);
    expect(match.resize).toHaveBeenLastCalledWith(640, 360, 1);
  });

  it('releases held input on blur and on a hidden tab, not on a visible one', () => {
    const { host, window, document, input } = setUp();
    host.start();
    window.dispatchEvent(new Event('blur'));
    expect(input.releaseAll).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(input.releaseAll).toHaveBeenCalledTimes(1);
    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(input.releaseAll).toHaveBeenCalledTimes(2);
  });

  it("follows the player's bindings from the settings event", () => {
    const { host, bus, mapper } = setUp();
    host.start();
    const settings = { ...settingsWithDefaults(null), bindings: PRESETS.arrows };
    bus.emit('settings', settings);
    expect(mapper.setBindings).toHaveBeenCalledWith(PRESETS.arrows);
  });

  it('pauses the match and releases held input; resuming releases nothing', () => {
    const { host, match, input } = setUp();
    host.start();
    host.setPaused(true);
    expect(match.setPaused).toHaveBeenLastCalledWith(true);
    expect(input.releaseAll).toHaveBeenCalledTimes(1);
    host.setPaused(false);
    expect(match.setPaused).toHaveBeenLastCalledWith(false);
    expect(input.releaseAll).toHaveBeenCalledTimes(1);
  });

  it('leaves 0 listeners and destroys the match before its adapters, once', () => {
    const { host, bus, log, listeners } = setUp();
    const busBefore = bus.listenerCount();
    host.start();

    host.destroy();
    host.destroy();

    expect(listeners()).toBe(0);
    expect(bus.listenerCount()).toBe(busBefore);
    expect(log).toEqual(['match.start', 'match.destroy', 'renderer.destroy', 'camera.destroy']);
  });

  it('undoes everything and rethrows when the match cannot start', () => {
    const { host, log, listeners } = setUp({ isStartThrowing: true });
    expect(() => {
      host.start();
    }).toThrow('start failed');
    expect(listeners()).toBe(0);
    expect(log).toEqual(['match.start', 'match.destroy', 'renderer.destroy', 'camera.destroy']);
  });
});
