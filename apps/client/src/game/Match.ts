import { type EntityId, type EntitySnapshot, makeLogRecord, type Snapshot } from '@eternalus/core';

import { isDead } from '../bridge/selectors/isDead';
import { BuildingRoofs } from './BuildingRoofs';
import { GameLoop } from './engine/loop/GameLoop';
import type { LoopTarget } from './engine/loop/GameLoop.types';
import type { WorldRect } from './engine/render/Renderer.types';
import {
  BACKGROUND_COLOR,
  HUD_MINIMAP_RING,
  MAX_TICKS_PER_FRAME,
  MS_PER_SECOND,
} from './Match.constants';
import type { MatchDeps } from './Match.types';
import { MatchBridge } from './MatchBridge';
import { MatchCamera } from './MatchCamera';
import { MatchViewControls } from './MatchViewControls';
import { PlayerCommands } from './PlayerCommands';
import { createDefaultViewRegistry } from './views/defaultViewRegistry';
import { EntityLayer } from './views/EntityLayer';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import { SceneryView } from './views/SceneryView';
import { SceneView } from './views/SceneView';
import { WorldObjectsView } from './views/WorldObjectsView';

/**
 * The composition root of one match (architecture 08 §7): it wires the simulation, the game loop,
 * the renderer, the camera, the player's intent and the views, and owns their lifetime. Each tick
 * turns the player's intent into commands (`PlayerCommands`), steps the simulation and keeps the
 * last two snapshots; each frame follows the player with the camera and draws the scene and the
 * minimap (inside the HUD ring). The player's Legend is the simulation's, spawned at its team's
 * Stronghold by core from the roster's human slot. Which part of the world is shown (the following
 * camera, or the free view that dragging and the overview switch to) is `MatchCamera`'s. Buildings
 * stay in the same world scene: `BuildingRoofs` cuts away the roof of the building the player's
 * Legend stands in (DEC-143) and those the developer explorer opens, and the views draw those
 * interiors in place. The minimap is player HUD, drawn every frame whatever the developer flag
 * (DEC-143). The world (map, presentation, map objects) arrives prepared (06 §1); its `MatchBridge`
 * publishes to the UI. The canvas gestures act through its `controls` (`MatchViewControls`).
 */
export class Match implements LoopTarget {
  private readonly loop: GameLoop;

  private readonly entities: EntityLayer;

  /** The map objects (walls, furniture, doors) and their destroyed state, drawn in the scene. */
  private readonly objects: WorldObjectsView;

  private readonly world: { readonly scene: SceneView; readonly miniMap: MiniMapView };

  private readonly camera: MatchCamera;

  private readonly roofs: BuildingRoofs;

  private readonly commands: PlayerCommands;

  private readonly bridge: MatchBridge;

  private previous: Snapshot | null = null;

  private current: Snapshot;

  private readonly playerId: EntityId | null;

  /** What the canvas gestures do to this match: camera, minimap, roofs, explorer attack. */
  public readonly controls: MatchViewControls;

  /**
   * Creates the match, takes the player's Legend from the simulation's snapshot (core spawned it
   * from the roster's human slot) and points the camera at it; with no Legend (the human slot
   * named no Legend definition), at the middle of the map.
   */
  public constructor(private readonly deps: MatchDeps) {
    const { simulation, world, tickRate, scheduler, camera, logger, bridge, input } = deps;
    const { map, presentation, mapObjects } = world;
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
    this.camera = new MatchCamera(camera, map);
    this.commands = new PlayerCommands(input, simulation, this.camera, mapObjects);
    const { scenery, buildings } = presentation;
    this.roofs = new BuildingRoofs(buildings);
    const { hidden: hiddenRoofs } = this.roofs;
    const shown = (): WorldRect => this.camera.visibleArea();
    this.objects = new WorldObjectsView(mapObjects, hiddenRoofs, shown);
    const { isDestroyed } = this.objects;
    const scene = new SceneView([
      new MapView(map, scenery, hiddenRoofs, shown, buildings, isDestroyed),
      new SceneryView(scenery, 'detail', hiddenRoofs, shown, isDestroyed),
      this.objects,
      this.entities,
    ]);
    this.world = { scene, miniMap: new MiniMapView(map, scene, HUD_MINIMAP_RING) };
    const tickMs = MS_PER_SECOND / tickRate;
    this.loop = new GameLoop(scheduler, this, {
      tickMs,
      maxFrameMs: MAX_TICKS_PER_FRAME * tickMs,
    });
    this.bridge = new MatchBridge({ ...bridge, tickRate, map, events: simulation });
    this.current = simulation.snapshot();
    this.playerId = this.current.match.humanLegendId;
    this.controls = new MatchViewControls({
      camera: this.camera,
      roofs: this.roofs,
      commands: this.commands,
      miniMap: this.world.miniMap,
      playerId: this.playerId,
      mapObjects: () => this.current.mapObjects ?? [],
    });
    camera.lookAt(this.playerEntity()?.transform ?? { x: map.width / 2, y: map.height / 2 });
  }

  /** The id of the player's Legend; known from construction, `null` when its spawn failed. */
  public get playerEntityId(): EntityId | null {
    return this.playerId;
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

  /**
   * One tick: the player's intent becomes commands (and moving input sends the camera back to
   * following), the simulation steps, and the roof of the building the player's Legend now stands
   * in opens. A dead Legend (`isDead`, or gone from the snapshot) stands in no building, so its
   * roof closes (DEC-143, DEC-149). After the tick that ended the match, tells the observer once
   * (`ended`).
   */
  public tick(): void {
    if (this.playerId !== null) {
      const isMoving = this.commands.apply(this.playerId, this.current.mapObjects ?? []);
      if (isMoving) {
        this.camera.playerMoved();
      }
    }
    this.deps.simulation.step();
    this.previous = this.current;
    this.current = this.deps.simulation.snapshot();
    const player = this.playerEntity();
    this.roofs.playerAt(isDead(player?.health ?? null) ? null : (player?.transform ?? null));
    if (this.bridge.afterTick(this.current, this.playerId)) {
      this.deps.observer.ended();
    }
  }

  /** One frame: the camera follows the player, then the scene and the minimap are drawn. */
  public render(alpha: number): void {
    const { renderer } = this.deps;
    this.camera.follow(this.playerEntity()?.transform ?? null);
    const view = this.camera.visibleArea();
    const { scene, miniMap } = this.world;
    renderer.clear(BACKGROUND_COLOR);
    renderer.showWorldArea(view);
    this.entities.show(this.previous, this.current, alpha, this.playerId);
    this.objects.show(this.current.mapObjects ?? []);
    scene.draw(renderer);
    miniMap.draw(renderer, this.camera.screenWidth, this.camera.screenHeight, view);
  }

  /**
   * The game loop stopped because a tick or a frame threw: hands the error and the tick to the
   * observer (`crashed`), whose owner ends the match (DEC-106).
   */
  public crashed(error: unknown): void {
    this.deps.observer.crashed({ error, tick: this.deps.simulation.tick });
  }

  /**
   * Stops the loop and the bridge's listener. The renderer and camera are injected, so their
   * owner (`MatchHost`) destroys them.
   */
  public destroy(): void {
    this.loop.destroy();
    this.bridge.destroy();
  }

  /** The player's Legend in the latest snapshot; `undefined` before it spawns or once removed. */
  private playerEntity(): EntitySnapshot | undefined {
    return this.current.entities.find((entity) => entity.id === this.playerId);
  }
}
