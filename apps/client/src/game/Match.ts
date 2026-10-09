import {
  CathedralInteriorBuilder,
  type EntityId,
  makeLogRecord,
  type MapDefinition,
  MapSceneryBuilder,
  type Snapshot,
  type Vec2,
} from '@eternalus/core';

import type { Projection } from './engine/input/Projection.types';
import type { WorldRect } from './engine/render/Renderer.types';
import { GameLoop } from './engine/loop/GameLoop';
import type { LoopTarget } from './engine/loop/GameLoop.types';
import {
  BACKGROUND_COLOR,
  CAMERA_SMOOTHING,
  DEFAULT_ASPECT,
  MAX_TICKS_PER_FRAME,
  PROTOTYPE_ESCORT,
  MS_PER_SECOND,
} from './Match.constants';
import type { MatchDeps } from './Match.types';
import { MapExplorer } from './MapExplorer';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';
import { createDefaultViewRegistry } from './views/defaultViewRegistry';
import { EntityLayer } from './views/EntityLayer';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import { SceneryView } from './views/SceneryView';
import { SceneView } from './views/SceneView';

/**
 * The composition root of one match (architecture 08 §7): it wires the simulation, the game
 * loop, the renderer, the camera, the player's intent and the views, and owns their lifetime.
 * Each tick turns the player's intent into commands, steps the simulation and keeps the last two
 * snapshots; each frame follows the player with the camera and draws the scene. The player's
 * Legend is spawned at its team's stronghold when the match is created. Dragging, the overview
 * and the cathedral interior switch to the free `MapExplorer` view until the player moves.
 */
export class Match implements LoopTarget {
  private readonly loop: GameLoop;

  private readonly entities: EntityLayer;

  private readonly world: { readonly scene: SceneView; readonly miniMap: MiniMapView };

  private readonly interior: { readonly scene: SceneView; readonly miniMap: MiniMapView } | null;

  private readonly explorer: MapExplorer;

  private readonly stopListening: () => void;

  private previous: Snapshot | null = null;

  private current: Snapshot;

  private playerId: EntityId | null = null;

  private lastMove: Vec2 = { x: 0, y: 0 };

  private isFollowing = true;

  /** Whether the free `MapExplorer` view is on screen instead of the camera's. */
  private isExploring = false;

  private screenWidth = 0;

  private screenHeight = 0;

  private pixelRatio = 1;

  /** Canvas CSS pixels → device pixels → the world point the camera shows there. */
  private readonly projection: Projection = {
    screenToWorld: (point) =>
      this.deps.camera.screenToWorld(
        { x: point.x * this.pixelRatio, y: point.y * this.pixelRatio },
        {
          worldWidth: this.deps.map.width,
          worldHeight: this.deps.map.height,
          screenWidth: this.screenWidth,
          screenHeight: this.screenHeight,
        },
      ),
  };

  /**
   * Creates the match, queues the player's spawn and points the camera at the spawn point.
   *
   * @throws Error when the map has no stronghold for the player's team.
   */
  public constructor(private readonly deps: MatchDeps) {
    const { simulation, map, tickRate, scheduler, camera, player, logger } = deps;
    // Find the spawn point first: if the map has none, nothing has been subscribed yet.
    const spawnPoint = Match.strongholdOf(map, player.team);
    this.entities = new EntityLayer(
      createDefaultViewRegistry((kind) => {
        logger.log(
          makeLogRecord(
            'WARN',
            'client.views',
            `No view for kind "${kind}"; drawing the default view.`,
          ),
        );
      }),
    );
    const scenery = new MapSceneryBuilder(map).build();
    const scene = new SceneView([
      new MapView(map, scenery),
      new SceneryView(scenery, 'detail'),
      this.entities,
    ]);
    this.world = { scene, miniMap: new MiniMapView(map, scene) };
    const interior = new CathedralInteriorBuilder().build(map);
    this.explorer = new MapExplorer(map, interior);
    if (interior === null) {
      this.interior = null;
    } else {
      const inside = new SceneView([
        new MapView(interior.map, interior.scenery),
        new SceneryView(interior.scenery, 'detail'),
      ]);
      this.interior = { scene: inside, miniMap: new MiniMapView(interior.map, inside) };
    }
    const tickMs = MS_PER_SECOND / tickRate;
    this.loop = new GameLoop(scheduler, this, {
      tickMs,
      maxFrameMs: MAX_TICKS_PER_FRAME * tickMs,
    });
    this.stopListening = simulation.on('entity-spawned', ({ entityId, kind, team }) => {
      if (this.playerId === null && kind === player.legend && team === player.team) {
        this.playerId = entityId;
      }
    });

    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: player.legend,
      definitionId: player.legend,
      team: player.team,
      at: spawnPoint,
      count: 1,
    });
    // PROTOTYPE(PROTO-01) TEMPORARY: demo escort; delete with `spawnEscort`.
    Match.spawnEscort(simulation, player.team, spawnPoint);
    this.current = simulation.snapshot();
    camera.lookAt(spawnPoint);
  }

  /** The id of the player's Legend, once it has spawned (after the first tick). */
  public get playerEntityId(): EntityId | null {
    return this.playerId;
  }

  /** Whether the view is inside the cathedral. */
  public get isInterior(): boolean {
    return this.explorer.isInterior;
  }

  /** The latest snapshot. */
  public get snapshot(): Snapshot {
    return this.current;
  }

  /** Starts the game loop. */
  public start(): void {
    this.loop.start();
  }

  /** Sets the drawing area in device pixels; call on mount and on every resize. */
  public resize(screenWidth: number, screenHeight: number, pixelRatio: number): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.pixelRatio = pixelRatio;
    this.deps.renderer.resize(screenWidth, screenHeight, pixelRatio);
  }

  /** One tick: the player's intent becomes commands, then the simulation steps. */
  public tick(): void {
    this.applyIntent();
    this.deps.simulation.step();
    this.previous = this.current;
    this.current = this.deps.simulation.snapshot();
  }

  /** One frame: the camera follows the player, then the scene and the minimap are drawn. */
  public render(alpha: number): void {
    const { renderer, camera } = this.deps;
    const player = this.current.entities.find((entity) => entity.id === this.playerId);
    if (this.isFollowing && player?.transform != null) {
      camera.track(player.transform, CAMERA_SMOOTHING);
    }
    const view = this.currentView();
    const { scene, miniMap } = this.views;
    renderer.clear(BACKGROUND_COLOR);
    renderer.showWorldArea(view);
    this.entities.show(this.previous, this.current, alpha, this.playerId);
    scene.draw(renderer);
    miniMap.draw(renderer, this.screenWidth, this.screenHeight, view);
  }

  /**
   * Moves the camera to the world point under a minimap click and stops following the player
   * until the player moves again.
   *
   * @returns Whether the click was on the minimap.
   */
  public lookAtMinimapPoint(screenX: number, screenY: number): boolean {
    const target = this.views.miniMap.worldPointAt(
      screenX,
      screenY,
      this.screenWidth,
      this.screenHeight,
    );
    if (target === null) {
      return false;
    }
    if (this.isExploring) {
      this.explorer.lookAt(target);
      this.explorer.zoomBy(EXPLORER_SETTINGS.minimapZoom);
    } else {
      this.deps.camera.lookAt(target);
    }
    this.isFollowing = false;
    return true;
  }

  /** Drags the view by a screen offset (device pixels), switching to the free view. */
  public panBy(screenDx: number, screenDy: number): void {
    this.explore();
    const area = this.explorer.areaFor(this.aspect);
    this.explorer.pan(
      (-screenDx * area.width) / this.screenWidth,
      (-screenDy * area.height) / this.screenHeight,
      this.aspect,
    );
  }

  /** Zooms whichever view is on screen; `factor` above 1 zooms in. */
  public zoomBy(factor: number): void {
    const { camera } = this.deps;
    if (this.isExploring) {
      this.explorer.zoomBy(factor);
    } else {
      camera.zoomTo(camera.zoom * factor);
    }
  }

  /**
   * Enters the cathedral when the screen point (device pixels) is on it.
   *
   * @returns Whether the view moved inside.
   */
  public enterAt(screenX: number, screenY: number): boolean {
    const view = this.currentView();
    const isEntered = this.explorer.enterAt({
      x: view.x + (screenX / this.screenWidth) * view.width,
      y: view.y + (screenY / this.screenHeight) * view.height,
    });
    if (isEntered) {
      this.isExploring = true;
      this.isFollowing = false;
    }
    return isEntered;
  }

  /** Shows the whole battlefield in the free view, leaving the cathedral if inside. */
  public overview(): void {
    this.explorer.overview();
    this.isExploring = true;
    this.isFollowing = false;
  }

  /**
   * Stops the loop and the event subscription. The renderer and camera are injected, so their
   * owner (`useMatch`) destroys them.
   */
  public destroy(): void {
    this.loop.destroy();
    this.stopListening();
  }

  private applyIntent(): void {
    if (this.playerId === null) {
      return;
    }
    const { move } = this.deps.input.read(this.projection);
    const isMoving = move.x !== 0 || move.y !== 0;
    // Any movement brings the camera back to the player, even a key held since before a click,
    // except inside the cathedral, which the player leaves with the leave button.
    if (isMoving && !this.explorer.isInterior) {
      this.isFollowing = true;
      this.isExploring = false;
    }
    if (move.x === this.lastMove.x && move.y === this.lastMove.y) {
      return;
    }
    this.deps.simulation.enqueueCommand(
      isMoving
        ? { type: 'move', actorId: this.playerId, direction: move }
        : { type: 'stop', actorId: this.playerId },
    );
    this.lastMove = move;
  }

  /** The scene and minimap on screen: the cathedral's inside it, the battlefield's otherwise. */
  private get views(): { readonly scene: SceneView; readonly miniMap: MiniMapView } {
    return this.explorer.isInterior && this.interior !== null ? this.interior : this.world;
  }

  /** The drawing area's width over its height, until the first resize a default. */
  private get aspect(): number {
    return this.screenHeight > 0 ? this.screenWidth / this.screenHeight : DEFAULT_ASPECT;
  }

  /** The part of the world on screen: the free view's or the camera's. */
  private currentView(): WorldRect {
    const { camera, map } = this.deps;
    return this.isExploring
      ? this.explorer.areaFor(this.aspect)
      : camera.visibleArea(map.width, map.height);
  }

  /** Switches to the free view, starting from what the camera shows so nothing jumps. */
  private explore(): void {
    if (!this.isExploring) {
      const { camera, map } = this.deps;
      this.explorer.showArea(camera.visibleArea(map.width, map.height), this.aspect);
      this.isExploring = true;
    }
    this.isFollowing = false;
  }

  /**
   * PROTOTYPE(PROTO-01) TEMPORARY: demo code; `SpawnSystem` replaces it.
   *
   * Prototype (2026-10-08, demo): queues the escort minions in a ring around `center`, one spawn
   * each so they start apart. Phase 2's `SpawnSystem` replaces this.
   */
  private static spawnEscort(
    simulation: MatchDeps['simulation'],
    team: MatchDeps['player']['team'],
    center: Vec2,
  ): void {
    const { definitionId, kind, count, spawnRadius } = PROTOTYPE_ESCORT;
    for (let index = 0; index < count; index += 1) {
      const angle = (2 * Math.PI * index) / count;
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind,
        definitionId,
        team,
        at: {
          x: center.x + spawnRadius * Math.cos(angle),
          y: center.y + spawnRadius * Math.sin(angle),
        },
        count: 1,
      });
    }
  }

  private static strongholdOf(map: MapDefinition, team: MatchDeps['player']['team']): Vec2 {
    const stronghold = map.features.find(
      (feature) => feature.kind === 'stronghold' && feature.team === team,
    );
    if (stronghold === undefined) {
      throw new Error(`Map "${map.id}" has no ${team} stronghold to spawn the player at.`);
    }
    return stronghold.position;
  }
}
