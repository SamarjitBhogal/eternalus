import { createDefaultGameConfig, MapGenerator, SEVERITY, Simulation } from '@eternalus/core';
import { type RefObject, useEffect } from 'react';

import { ConsoleSink } from '../data/logging/ConsoleSink';
import { RingBufferSink } from '../data/logging/RingBufferSink';
import { SinkLogger } from '../data/logging/SinkLogger';
import { Camera } from './engine/Camera';
import { RafFrameScheduler } from './engine/loop/RafFrameScheduler';
import { Canvas2dRenderer } from './engine/render/Canvas2dRenderer';
import { IdleIntentSource } from './IdleIntentSource';
import { Match } from './Match';
import {
  FOLLOW_VIEW_HEIGHT,
  FOLLOW_VIEW_WIDTH,
  LOG_RING_CAPACITY,
  PLACEHOLDER_MATCH_SEED,
} from './Match.constants';

/**
 * Creates a `Match` on the canvas when it mounts and destroys it on unmount: a Warrior at the
 * Light stronghold on the generated map, the camera following it and the minimap in its corner.
 * Placeholder wiring until match setup (session E) passes the player's choices and the input
 * session (F) replaces `IdleIntentSource` with the keyboard.
 */
export function useMatch(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = canvas === null ? null : Canvas2dRenderer.fromCanvas(canvas);
    if (canvas === null || renderer === null) {
      return undefined;
    }
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, PLACEHOLDER_MATCH_SEED);
    const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
    // Warnings and worse reach the console; everything is kept for bug reports and the overlay.
    const logger = new SinkLogger(
      () => performance.now(),
      [
        { sink: new ConsoleSink(), minSeverity: SEVERITY.WARN },
        { sink: new RingBufferSink(LOG_RING_CAPACITY), minSeverity: SEVERITY.TRACE },
      ],
    );
    const match = new Match({
      simulation: new Simulation({ config, seed: PLACEHOLDER_MATCH_SEED, logger }),
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
      input: new IdleIntentSource(),
      player: { legend: 'warrior', team: 'light' },
    });

    const resize = (): void => {
      const pixelRatio = window.devicePixelRatio;
      canvas.width = Math.round(canvas.clientWidth * pixelRatio);
      canvas.height = Math.round(canvas.clientHeight * pixelRatio);
      match.resize(canvas.width, canvas.height, pixelRatio);
    };

    const lookAtMinimapClick = (event: MouseEvent): void => {
      // The click is in CSS pixels; the canvas may have more real pixels, so scale it up.
      const bounds = canvas.getBoundingClientRect();
      match.lookAtMinimapPoint(
        (event.clientX - bounds.left) * (canvas.width / bounds.width),
        (event.clientY - bounds.top) * (canvas.height / bounds.height),
      );
    };

    resize();
    match.start();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', lookAtMinimapClick);
    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', lookAtMinimapClick);
      match.destroy();
      renderer.destroy();
      camera.destroy();
    };
  }, [canvasRef]);
}
