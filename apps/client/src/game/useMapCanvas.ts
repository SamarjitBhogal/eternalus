import { MAP_1 } from '@eternalus/core';
import { type RefObject, useEffect, useRef, useState } from 'react';

import { Renderer } from './engine/Renderer';
import { MapExplorer } from './MapExplorer';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import { SceneView } from './views/SceneView';
import { SceneryView } from './views/SceneryView';

/** Wires presentation-only pan, zoom, minimap navigation and cathedral inspection. */
export function useMapCanvas(canvasRef: RefObject<HTMLCanvasElement | null>): {
  readonly isInterior: boolean;
  readonly overview: () => void;
} {
  const [isInterior, setIsInterior] = useState(false);
  const resetRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = canvas === null ? null : Renderer.fromCanvas(canvas);
    if (canvas === null || renderer === null) return undefined;
    const explorer = new MapExplorer(MAP_1);
    const createScene = (): SceneView =>
      new SceneView([
        new MapView(explorer.currentMap),
        new SceneryView(explorer.currentMap, 'detail'),
      ]);
    let scene = createScene();
    let miniMap = new MiniMapView(explorer.currentMap, scene);
    let drag: { x: number; y: number; distance: number } | null = null;

    const draw = (): void => {
      const ratio = window.devicePixelRatio;
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
      renderer.resize(canvas.width, canvas.height);
      const view = explorer.areaFor(canvas.width / canvas.height);
      renderer.clear(EXPLORER_SETTINGS.background);
      renderer.showWorldArea(view);
      scene.draw(renderer);
      miniMap.draw(renderer, canvas.width, canvas.height, view);
    };
    const rebuild = (): void => {
      scene = createScene();
      miniMap = new MiniMapView(explorer.currentMap, scene);
      setIsInterior(explorer.isInterior);
      draw();
    };
    resetRef.current = (): void => {
      explorer.overview();
      rebuild();
    };

    const screenPoint = (event: MouseEvent): { x: number; y: number } => {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
        y: ((event.clientY - bounds.top) * canvas.height) / bounds.height,
      };
    };
    const pointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) return;
      const point = screenPoint(event);
      const target = miniMap.worldPointAt(point.x, point.y, canvas.width, canvas.height);
      if (target !== null) {
        explorer.lookAt(target);
        explorer.zoomBy(2);
        draw();
        return;
      }
      drag = { x: event.clientX, y: event.clientY, distance: 0 };
      canvas.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event: PointerEvent): void => {
      if (drag === null) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      const area = explorer.areaFor(canvas.clientWidth / canvas.clientHeight);
      explorer.pan(
        (-dx * area.width) / canvas.clientWidth,
        (-dy * area.height) / canvas.clientHeight,
        canvas.clientWidth / canvas.clientHeight,
      );
      drag = { x: event.clientX, y: event.clientY, distance: drag.distance + Math.hypot(dx, dy) };
      draw();
    };
    const pointerUp = (event: PointerEvent): void => {
      if (drag !== null && drag.distance < 5) {
        const point = screenPoint(event);
        const area = explorer.areaFor(canvas.width / canvas.height);
        if (
          explorer.enterAt({
            x: area.x + (point.x / canvas.width) * area.width,
            y: area.y + (point.y / canvas.height) * area.height,
          })
        )
          rebuild();
      }
      drag = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const cancelDrag = (): void => {
      drag = null;
    };
    const wheel = (event: WheelEvent): void => {
      event.preventDefault();
      explorer.zoomBy(Math.exp(-event.deltaY * EXPLORER_SETTINGS.wheelSensitivity));
      draw();
    };

    draw();
    window.addEventListener('resize', draw);
    window.addEventListener('blur', cancelDrag);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', cancelDrag);
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => {
      window.removeEventListener('resize', draw);
      window.removeEventListener('blur', cancelDrag);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', cancelDrag);
      canvas.removeEventListener('wheel', wheel);
      resetRef.current = (): void => undefined;
      renderer.destroy();
    };
  }, [canvasRef]);

  return {
    isInterior,
    overview: (): void => {
      resetRef.current();
    },
  };
}
