import { DEFAULT_MAP_CONFIG, MapGenerator } from '@eternalus/core';
import { type RefObject, useEffect } from 'react';

import { Camera } from './engine/Camera';
import { Canvas2dRenderer } from './engine/render/Canvas2dRenderer';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import { SceneView } from './views/SceneView';

/** Colour behind the map, only visible if the view ever reaches past the map's edges. */
const BACKGROUND_COLOR = '#2b2620';

/** Seed for the generated map until `Match` owns the match seed. */
const MAP_SEED = 1;

/** Where the main view starts looking: the Light team's side of the map, in world units. */
const CAMERA_START_CENTER = { x: 320, y: 450 };

/** How much of the map the main view shows left to right, in world units. TUNE: zoom. */
const CAMERA_VISIBLE_WIDTH = 800;

/** How much of the map the main view shows top to bottom, in world units. TUNE: zoom. */
const CAMERA_VISIBLE_HEIGHT = 900;

/**
 * Draws a zoomed-in view of the generated map plus a mini map of the whole map. Redraws when the window
 * is resized, and clicking the mini map moves the camera to that spot.
 * Temporary wiring until `Match` and `GameLoop` exist and take over drawing.
 */
export function useMapCanvas(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = canvas === null ? null : Canvas2dRenderer.fromCanvas(canvas);
    if (canvas === null || renderer === null) {
      return undefined;
    }
    // TODO(sholtzman): use createDefaultGameConfig() once session B's config/ lands.
    const map = new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, MAP_SEED);
    const camera = new Camera(CAMERA_START_CENTER, CAMERA_VISIBLE_WIDTH, CAMERA_VISIBLE_HEIGHT);
    // Add new layers (obstacles, units) to this list and they appear in both views.
    const scene = new SceneView([new MapView(map)]);
    const miniMap = new MiniMapView(map, scene);

    const draw = (): void => {
      const pixelRatio = window.devicePixelRatio;
      canvas.width = Math.round(canvas.clientWidth * pixelRatio);
      canvas.height = Math.round(canvas.clientHeight * pixelRatio);
      renderer.resize(canvas.width, canvas.height, pixelRatio);
      const view = camera.visibleArea(map.width, map.height);
      renderer.clear(BACKGROUND_COLOR);
      renderer.showWorldArea(view);
      scene.draw(renderer);
      miniMap.draw(renderer, canvas.width, canvas.height, view);
    };

    const jumpToClick = (event: MouseEvent): void => {
      // The click is in CSS pixels; the canvas may have more real pixels, so scale it up.
      const bounds = canvas.getBoundingClientRect();
      const screenX = (event.clientX - bounds.left) * (canvas.width / bounds.width);
      const screenY = (event.clientY - bounds.top) * (canvas.height / bounds.height);
      const target = miniMap.worldPointAt(screenX, screenY, canvas.width, canvas.height);
      if (target !== null) {
        camera.lookAt(target);
        draw();
      }
    };

    draw();
    window.addEventListener('resize', draw);
    canvas.addEventListener('click', jumpToClick);
    return () => {
      window.removeEventListener('resize', draw);
      canvas.removeEventListener('click', jumpToClick);
      renderer.destroy();
      camera.destroy();
    };
  }, [canvasRef]);
}
