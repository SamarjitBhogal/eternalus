import {
  type Command,
  type EntityId,
  makeLogRecord,
  type MapDefinition,
  type Snapshot,
  type Vec2,
} from '@eternalus/core';

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
 * (inside the HUD ring). The player's Legend is spawned at its team's stronghold when the match is
 * created. Which part of the world is shown (the following camera, or the free view that
 * dragging, the overview and the cathedral interior switch to) is `MatchCamera`'s. The world
 * (map, scenery, interior) arrives prepared (06 §1); its `MatchBridge` publishes to the UI.
 */
export class Match implements LoopTarget {
  private readonly loop: GameLoop;

  private readonly entities: EntityLayer;

  private readonly world: { readonly scene: SceneView; readonly miniMap: MiniMapView };

  private readonly interior: { readonly scene: SceneView; readonly miniMap: MiniMapView } | null;

  private readonly camera: MatchCamera;

  private readonly stopListening: () => void;

  private readonly bridge: MatchBridge;

  private previous: Snapshot | null = null;

  private current: Snapshot;

  private playerId: EntityId | null = null;

  private lastMove: Vec2 = { x: 0, y: 0 };

  /**
   * Creates the match, queues the player's spawn (`spawnPlayer`) and points the camera at the
   * spawn point.
   *
   * @throws Error when the map has no stronghold for the player's team.
   */
  public constructor(private readonly deps: MatchDeps) {
    const { simulation, world, tickRate, scheduler, camera, player, logger, bridge } = deps;
    const { map, scenery, interior } = world;
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
    this.stopListening = this.spawnPlayer(spawnPoint);
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
   * The game loop stopped because a tick or a frame threw: hands the error and the tick to the
   * match's owner (`onCrash`), which ends the match (DEC-106).
   */
  public crashed(error: unknown): void {
    this.deps.onCrash({ error, tick: this.deps.simulation.tick });
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
   * Stops the loop and the event subscription. The renderer and camera are injected, so their
   * owner (`MatchHost`) destroys them.
   */
  public destroy(): void {
    this.loop.destroy();
    this.stopListening();
  }

  /**
   * Queues the player's spawn at `at` and watches for it: the spawned Legend becomes
   * `playerEntityId`; a rejected spawn logs ERROR `client.match` naming the class id and the
   * reason (the match then runs with no player Legend). Returns the unsubscribe.
   */
  private spawnPlayer(at: Vec2): () => void {
    const { simulation, player, logger } = this.deps;
    const spawn: Command<'dev-spawn'> = {
      type: 'dev-spawn',
      kind: player.legend,
      definitionId: player.legend,
      team: player.team,
      at,
      count: 1,
    };
    const stopSpawned = simulation.on('entity-spawned', ({ entityId, kind, team }) => {
      if (this.playerId === null && kind === player.legend && team === player.team) {
        this.playerId = entityId;
      }
    });
    const stopRejected = simulation.on('command-rejected', ({ command, reason }) => {
      if (command !== spawn) return;
      logger.log(
        makeLogRecord(
          'ERROR',
          'client.match',
          `The player's Legend "${player.legend}" did not spawn: ${reason}.`,
          { attributes: { classId: player.legend, reason } },
        ),
      );
    });
    simulation.enqueueCommand(spawn);
    return () => {
      stopSpawned();
      stopRejected();
    };
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
