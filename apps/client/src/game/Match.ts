import { type EntityId, makeLogRecord, type Snapshot, type Vec2 } from '@eternalus/core';

import { GameLoop } from './engine/loop/GameLoop';
import type { LoopTarget } from './engine/loop/GameLoop.types';
import {
  BACKGROUND_COLOR,
  HUD_MINIMAP_RING,
  MAX_TICKS_PER_FRAME,
  PROTOTYPE_ESCORT,
  MS_PER_SECOND,
} from './Match.constants';
import type { MatchDeps } from './Match.types';
import { MatchBridge } from './MatchBridge';
import { MatchCamera } from './MatchCamera';
import { strongholdOf } from './seatedConfig';
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
 * snapshots; each frame follows the player with the camera and draws the scene and the minimap
 * (inside the HUD ring). The player's Legend is the simulation's, spawned at its team's stronghold
 * by core from the config's seat. Which part of the world is shown (the following camera, or the free view that
 * dragging, the overview and the cathedral interior switch to) is `MatchCamera`'s. The world
 * (map, scenery, interior) arrives prepared (06 §1); its `MatchBridge` publishes to the UI.
 */
export class Match implements LoopTarget {
  private readonly loop: GameLoop;

  private readonly entities: EntityLayer;

  private readonly world: { readonly scene: SceneView; readonly miniMap: MiniMapView };

  private readonly interior: { readonly scene: SceneView; readonly miniMap: MiniMapView } | null;

  private readonly camera: MatchCamera;

  private readonly bridge: MatchBridge;

  private previous: Snapshot | null = null;

  private current: Snapshot;

  private readonly playerId: EntityId | null;

  private lastMove: Vec2 = { x: 0, y: 0 };

  /**
   * Creates the match, takes the player's Legend from the simulation's snapshot (core spawned it
   * from the config's seat) and points the camera at the spawn point.
   *
   * @throws Error when the map has no stronghold for the player's team.
   */
  public constructor(private readonly deps: MatchDeps) {
    const { simulation, world, tickRate, scheduler, camera, player, logger, bridge } = deps;
    const { map, scenery, interior } = world;
    // Find the spawn point first: if the map has none, nothing has been subscribed yet.
    const spawnPoint = strongholdOf(map, player.team);
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
    const scene = new SceneView([
      new MapView(map, scenery),
      new SceneryView(scenery, 'detail'),
      this.entities,
    ]);
    this.world = { scene, miniMap: new MiniMapView(map, scene, HUD_MINIMAP_RING) };
    this.camera = new MatchCamera(camera, map, interior);
    if (interior === null) {
      this.interior = null;
    } else {
      const inside = new SceneView([
        new MapView(interior.map, interior.scenery),
        new SceneryView(interior.scenery, 'detail'),
      ]);
      this.interior = {
        scene: inside,
        miniMap: new MiniMapView(interior.map, inside, HUD_MINIMAP_RING),
      };
    }
    const tickMs = MS_PER_SECOND / tickRate;
    this.loop = new GameLoop(scheduler, this, {
      tickMs,
      maxFrameMs: MAX_TICKS_PER_FRAME * tickMs,
    });
    this.bridge = new MatchBridge({ ...bridge, tickRate, map });
    // PROTOTYPE(PROTO-01) TEMPORARY: demo escort; delete with `spawnEscort`.
    Match.spawnEscort(simulation, player.team, spawnPoint);
    this.current = simulation.snapshot();
    this.playerId = this.current.match.humanLegendId;
    camera.lookAt(spawnPoint);
  }

  /** The id of the player's Legend; known from construction, `null` when its spawn failed. */
  public get playerEntityId(): EntityId | null {
    return this.playerId;
  }

  /** Whether the view is inside the cathedral. */
  public get isInterior(): boolean {
    return this.camera.isInterior;
  }

  /** The latest snapshot. */
  public get snapshot(): Snapshot {
    return this.current;
  }

  /** Publishes everything the HUD shows once, then starts the game loop. */
  public start(): void {
    this.bridge.publishAll(this.current, this.playerId);
    this.loop.start();
  }

  /**
   * Stops the loop (pause) or starts it again; the loop keeps its remainder and restarts its frame
   * clock, so paused time is not simulated (13 §7: the match pauses from `pause-menu`; ES-11).
   */
  public setPaused(isPaused: boolean): void {
    if (isPaused) {
      this.loop.stop();
    } else {
      this.loop.start();
    }
  }

  /** Sets the drawing area in device pixels; call on mount and on every resize. */
  public resize(screenWidth: number, screenHeight: number, pixelRatio: number): void {
    this.camera.resize(screenWidth, screenHeight, pixelRatio);
    this.deps.renderer.resize(screenWidth, screenHeight, pixelRatio);
  }

  /** One tick: the player's intent becomes commands, then the simulation steps. */
  public tick(): void {
    this.applyIntent();
    this.deps.simulation.step();
    this.previous = this.current;
    this.current = this.deps.simulation.snapshot();
    this.bridge.afterTick(this.current, this.playerId);
  }

  /** One frame: the camera follows the player, then the scene and the minimap are drawn. */
  public render(alpha: number): void {
    const { renderer } = this.deps;
    const player = this.current.entities.find((entity) => entity.id === this.playerId);
    this.camera.follow(player?.transform ?? null);
    const view = this.camera.visibleArea();
    const { scene, miniMap } = this.views;
    renderer.clear(BACKGROUND_COLOR);
    renderer.showWorldArea(view);
    this.entities.show(this.previous, this.current, alpha, this.playerId);
    scene.draw(renderer);
    miniMap.draw(renderer, this.camera.screenWidth, this.camera.screenHeight, view);
  }

  /**
   * Moves the camera to the world point under a minimap click and stops following the player
   * until the player moves again.
   *
   * @returns Whether the click was on the minimap.
   */
  public lookAtMinimapPoint(screenX: number, screenY: number): boolean {
    const { screenWidth, screenHeight } = this.camera;
    const target = this.views.miniMap.worldPointAt(screenX, screenY, screenWidth, screenHeight);
    if (target === null) {
      return false;
    }
    this.camera.lookAt(target);
    return true;
  }

  /** Drags the view by a screen offset (device pixels), switching to the free view. */
  public panBy(screenDx: number, screenDy: number): void {
    this.camera.panBy(screenDx, screenDy);
  }

  /** Zooms whichever view is on screen; `factor` above 1 zooms in. */
  public zoomBy(factor: number): void {
    this.camera.zoomBy(factor);
  }

  /**
   * Enters the cathedral when the screen point (device pixels) is on it.
   *
   * @returns Whether the view moved inside.
   */
  public enterAt(screenX: number, screenY: number): boolean {
    return this.camera.enterAt(screenX, screenY);
  }

  /** Shows the whole battlefield in the free view, leaving the cathedral if inside. */
  public overview(): void {
    this.camera.overview();
  }

  /**
   * Leaves the cathedral interior and returns the camera to following the player (DEC-32 keeps the
   * interior in normal play; CD-22).
   */
  public leaveInterior(): void {
    this.camera.leaveInterior();
  }

  /**
   * Stops the loop. The renderer and camera are injected, so their
   * owner (`MatchHost`) destroys them.
   */
  public destroy(): void {
    this.loop.destroy();
  }

  private applyIntent(): void {
    if (this.playerId === null) {
      return;
    }
    const { move } = this.deps.input.read(this.camera);
    const isMoving = move.x !== 0 || move.y !== 0;
    if (isMoving) {
      this.camera.playerMoved();
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
    return this.camera.isInterior && this.interior !== null ? this.interior : this.world;
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
}
