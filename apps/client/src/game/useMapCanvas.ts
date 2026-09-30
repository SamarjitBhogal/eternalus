import { MAP_1 } from '@eternalus/core';
import { type RefObject, useEffect } from 'react';

import { Camera } from './engine/Camera';
import { Renderer } from './engine/Renderer';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import { SceneView } from './views/SceneView';
/** Colour behind the map, only visible if the view ever reaches past the map's edges. */
const BACKGROUND_COLOR = '#2b2620';

/** Where the main view starts looking: the Light team's side of map-1, in world units. */
const CAMERA_START_CENTER = { x: 320, y: 450 };

/** How much of the map the main view shows across the screen, in world units. */
const CAMERA_VISIBLE_WIDTH = 800;

const CAMERA_VISIBLE_HEIGHT = 900;
/**
 * Draws a zoomed-in view of map-1 plus a mini map of the whole map, and redraws them whenever
 * the window is resized.
 * Temporary wiring until `Match` and `GameLoop` exist and take over drawing.
 */
export function useMapCanvas(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = canvas === null ? null : Renderer.fromCanvas(canvas);
    if (canvas === null || renderer === null) {
      return undefined;
    }
    const camera = new Camera(CAMERA_START_CENTER, CAMERA_VISIBLE_WIDTH, CAMERA_VISIBLE_HEIGHT);
    // Add new layers (obstacles, units) to this list and they appear in both views.
    const scene = new SceneView([new MapView(MAP_1)]);
    const miniMap = new MiniMapView(MAP_1, scene);

    const draw = (): void => {
      const pixelRatio = window.devicePixelRatio;
      canvas.width = Math.round(canvas.clientWidth * pixelRatio);
      canvas.height = Math.round(canvas.clientHeight * pixelRatio);
      renderer.resize(canvas.width, canvas.height);
      const view = camera.visibleArea(MAP_1.width, MAP_1.height);
      renderer.clear(BACKGROUND_COLOR);
      renderer.showWorldArea(view);
      scene.draw(renderer);
      miniMap.draw(renderer, canvas.width, canvas.height, view);
    };

    draw();
    window.addEventListener('resize', draw);
    return () => {
      window.removeEventListener('resize', draw);
      renderer.destroy();
      camera.destroy();
    };
  }, [canvasRef]);
}
