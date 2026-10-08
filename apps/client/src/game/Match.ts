import {
  type EntityId,
  makeLogRecord,
  type MapDefinition,
  type Snapshot,
  type Vec2,
} from '@eternalus/core';

import type { Projection } from './engine/input/Projection.types';
import { GameLoop } from './engine/loop/GameLoop';
import type { LoopTarget } from './engine/loop/GameLoop.types';
import { BACKGROUND_COLOR, CAMERA_SMOOTHING, MAX_TICKS_PER_FRAME } from './Match.constants';
import type { MatchDeps } from './Match.types';
import { DefaultViewRegistry } from './views/DefaultViewRegistry';
import { EntityLayer } from './views/EntityLayer';
import { MapView } from './views/MapView';
import { MiniMapView } from './views/MiniMapView';
import { SceneView } from './views/SceneView';

/**
 * The composition root of one match (architecture 08 §7): it wires the simulation, the game
 * loop, the renderer, the camera, the player's intent and the views, and owns their lifetime.
 * Each tick turns the player's intent into commands, steps the simulation and keeps the last two
 * snapshots; each frame follows the player with the camera and draws the scene. The player's
 * Legend is spawned at its team's stronghold when the match is created.
 */
export class Match implements LoopTarget {
  private readonly loop: GameLoop;

  private readonly entities: EntityLayer;

  private readonly scene: SceneView;

  private readonly miniMap: MiniMapView;

  private readonly stopListening: () => void;

  private previous: Snapshot | null = null;

  private current: Snapshot;

  private playerId: EntityId | null = null;

  private lastMove: Vec2 = { x: 0, y: 0 };

  private isFollowing = true;

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
      new DefaultViewRegistry((kind) => {
        logger.log(
          makeLogRecord(
            'WARN',
            'client.views',
            `No view for kind "${kind}"; drawing the default view.`,
          ),
        );
      }),
    );
    this.scene = new SceneView([new MapView(map), this.entities]);
    this.miniMap = new MiniMapView(map, this.scene);
    const tickMs = 1000 / tickRate;
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
    this.current = simulation.snapshot();
    camera.lookAt(spawnPoint);
  }

  /** The id of the player's Legend, once it has spawned (after the first tick). */
  public get playerEntityId(): EntityId | null {
    return this.playerId;
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
    const { renderer, camera, map } = this.deps;
    const player = this.current.entities.find((entity) => entity.id === this.playerId);
    if (this.isFollowing && player?.transform != null) {
      camera.track(player.transform, CAMERA_SMOOTHING);
    }
    const view = camera.visibleArea(map.width, map.height);
    renderer.clear(BACKGROUND_COLOR);
    renderer.showWorldArea(view);
    this.entities.show(this.previous, this.current, alpha, this.playerId);
    this.scene.draw(renderer);
    this.miniMap.draw(renderer, this.screenWidth, this.screenHeight, view);
  }

  /**
   * Moves the camera to the world point under a minimap click and stops following the player
   * until the player moves again.
   *
   * @returns Whether the click was on the minimap.
   */
  public lookAtMinimapPoint(screenX: number, screenY: number): boolean {
    const target = this.miniMap.worldPointAt(screenX, screenY, this.screenWidth, this.screenHeight);
    if (target === null) {
      return false;
    }
    this.deps.camera.lookAt(target);
    this.isFollowing = false;
    return true;
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
    // Any movement brings the camera back to the player, even a key held since before a click.
    this.isFollowing ||= isMoving;
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
