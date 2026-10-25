import { createDefaultGameConfig, MapGenerator, SEVERITY, Simulation } from '@eternalus/core';
import { type RefObject, useEffect, useRef, useState } from 'react';

import { ConsoleSink } from '../data/logging/ConsoleSink';
import { RingBufferSink } from '../data/logging/RingBufferSink';
import { SinkLogger } from '../data/logging/SinkLogger';
import { Camera } from './engine/Camera';
import { RafFrameScheduler } from './engine/loop/RafFrameScheduler';
import { Canvas2dRenderer } from './engine/render/Canvas2dRenderer';
import { KeyboardDevice } from './engine/input/KeyboardDevice';
import { MouseDevice } from './engine/input/MouseDevice';
import { DeviceIntentSource } from './DeviceIntentSource';
import { InputMapper } from './input/InputMapper';
import { PRESETS } from './input/keybindings';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';
import { Match } from './Match';
import {
  FOLLOW_VIEW_HEIGHT,
  FOLLOW_VIEW_WIDTH,
  LOG_RING_CAPACITY,
  PLACEHOLDER_MATCH_SEED,
  PLACEHOLDER_PLAYER,
  placeholderRoster,
} from './Match.constants';
import { CLICK_SLOP } from './useMatch.constants';

/**
 * Creates a `Match` on the canvas when it mounts and destroys it on unmount: a Warrior at the
 * Light stronghold on the generated map, walked with the default keys (WASD) and aimed with the
 * mouse, the camera following
 * it and the minimap in its corner. Placeholder wiring until match setup (session E) passes the
 * player's choices and the settings screen passes the player's saved bindings.
 * Dragging pans the free view, the wheel zooms, a click on the cathedral steps inside, and
 * `overview` shows the whole battlefield (or leaves the cathedral).
 */
export function useMatch(canvasRef: RefObject<HTMLCanvasElement | null>): {
  readonly isInterior: boolean;
  readonly overview: () => void;
} {
  const [isInterior, setIsInterior] = useState(false);
  const overviewRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = canvas === null ? null : Canvas2dRenderer.fromCanvas(canvas);
    if (canvas === null || renderer === null) {
      return undefined;
    }
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, PLACEHOLDER_MATCH_SEED);
    // The match points the camera at the player's spawn, so its start point does not matter.
    const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
    // Warnings and worse reach the console; everything is kept for bug reports and the overlay.
    const logger = new SinkLogger(
      () => performance.now(),
      [
        { sink: new ConsoleSink(), minSeverity: SEVERITY.WARN },
        { sink: new RingBufferSink(LOG_RING_CAPACITY), minSeverity: SEVERITY.TRACE },
      ],
    );
    const mapper = new InputMapper(PRESETS.wasd);
    const keyboard = new KeyboardDevice((code) => mapper.isBound(code));
    const mouse = new MouseDevice();
    const input = new DeviceIntentSource([keyboard, mouse], mapper);
    let match: Match;
    try {
      match = new Match({
        simulation: new Simulation({
          config,
          seed: PLACEHOLDER_MATCH_SEED,
          logger,
          map,
          roster: placeholderRoster(config.match.legendsPerTeam),
        }),
        map,
        tickRate: config.tickRate,
        scheduler: new RafFrameScheduler({
          requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
          cancelAnimationFrame: (handle) => {
            window.cancelAnimationFrame(handle);
          },
        }),
        renderer,
        camera,
        input,
        player: PLACEHOLDER_PLAYER,
        logger,
      });
    } catch (error) {
      // Nothing else was created yet: release what was, then let the error surface.
      renderer.destroy();
      camera.destroy();
      throw error;
    }

    const resize = (): void => {
      const pixelRatio = window.devicePixelRatio;
      canvas.width = Math.round(canvas.clientWidth * pixelRatio);
      canvas.height = Math.round(canvas.clientHeight * pixelRatio);
      match.resize(canvas.width, canvas.height, pixelRatio);
    };

    // Pointer positions arrive in CSS pixels; the canvas may have more real pixels.
    const screenPoint = (event: MouseEvent): { x: number; y: number } => {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
        y: ((event.clientY - bounds.top) * canvas.height) / bounds.height,
      };
    };
    let drag: { x: number; y: number; distance: number } | null = null;
    const pointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) return;
      const point = screenPoint(event);
      if (match.lookAtMinimapPoint(point.x, point.y)) return;
      drag = { x: event.clientX, y: event.clientY, distance: 0 };
      canvas.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event: PointerEvent): void => {
      if (drag === null) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      match.panBy(
        dx * (canvas.width / canvas.clientWidth),
        dy * (canvas.height / canvas.clientHeight),
      );
      drag = { x: event.clientX, y: event.clientY, distance: drag.distance + Math.hypot(dx, dy) };
    };
    const pointerUp = (event: PointerEvent): void => {
      if (drag !== null && drag.distance < CLICK_SLOP) {
        const point = screenPoint(event);
        if (match.enterAt(point.x, point.y)) setIsInterior(true);
      }
      drag = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const cancelDrag = (): void => {
      drag = null;
    };
    const wheel = (event: WheelEvent): void => {
      event.preventDefault();
      match.zoomBy(Math.exp(-event.deltaY * EXPLORER_SETTINGS.wheelSensitivity));
    };
    overviewRef.current = (): void => {
      match.overview();
      setIsInterior(false);
    };

    // No key-up arrives for keys held while the tab loses focus, so release them all (09 §2).
    const releaseInput = (): void => {
      input.releaseAll();
      cancelDrag();
    };
    const releaseInputWhenHidden = (): void => {
      if (document.hidden) {
        input.releaseAll();
      }
    };

    resize();
    keyboard.attach(window);
    mouse.attach(canvas);
    match.start();
    window.addEventListener('resize', resize);
    window.addEventListener('blur', releaseInput);
    document.addEventListener('visibilitychange', releaseInputWhenHidden);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', cancelDrag);
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', releaseInput);
      document.removeEventListener('visibilitychange', releaseInputWhenHidden);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', cancelDrag);
      canvas.removeEventListener('wheel', wheel);
      overviewRef.current = (): void => undefined;
      keyboard.detach();
      mouse.detach();
      match.destroy();
      renderer.destroy();
      camera.destroy();
    };
  }, [canvasRef]);

  return {
    isInterior,
    overview: (): void => {
      overviewRef.current();
    },
  };
}
