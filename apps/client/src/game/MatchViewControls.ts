import type { MatchViewControlsDeps } from './MatchViewControls.types';

/**
 * What the canvas gestures (`CanvasPointerControls`) do to one match: move, drag and zoom the
 * camera, look at a minimap point, on a plain developer-explorer click attack a unit, cut away or
 * put back a roof, or attack a map object (DEC-150, DEC-183), and claim the main button's press
 * (06 §10). `Match` builds it from its camera, roofs, player commands and minimap, and stays the
 * composition root (DEC-139, INBOX HC-S6). Positions arrive in device pixels.
 */
export class MatchViewControls {
  /** Creates the controls over the match's parts; they act at once, nothing to attach. */
  public constructor(private readonly deps: MatchViewControlsDeps) {}

  /**
   * Whether the developer explorer opened any roof (the toolbar then offers to restore them); the
   * roof of the player's building does not count.
   */
  public get hasDeveloperRoofs(): boolean {
    return this.deps.roofs.hasOpened;
  }

  /**
   * Moves the camera to the world point under a minimap click and stops following the player
   * until the player moves again.
   *
   * @returns Whether the click was on the minimap.
   */
  public lookAtMinimapPoint(screenX: number, screenY: number): boolean {
    const { camera, miniMap } = this.deps;
    const { screenWidth, screenHeight } = camera;
    const target = miniMap.worldPointAt(screenX, screenY, screenWidth, screenHeight);
    if (target === null) {
      return false;
    }
    camera.lookAt(target);
    return true;
  }

  /**
   * The player's minimap key: shows or hides the minimap (canvas and HUD ring), and tells the UI
   * (DEC-147). A hidden minimap takes no click.
   */
  public toggleMiniMap(): void {
    const { miniMap, onMiniMapShownChanged } = this.deps;
    miniMap.toggle();
    onMiniMapShownChanged(miniMap.isVisible);
  }

  /** Drags the view by a screen offset (device pixels), switching to the free view. */
  public panBy(screenDx: number, screenDy: number): void {
    this.deps.camera.panBy(screenDx, screenDy);
  }

  /** Zooms whichever view is on screen; `factor` above 1 zooms in. */
  public zoomBy(factor: number): void {
    this.deps.camera.zoomBy(factor);
  }

  /**
   * The developer explorer's click at a screen point (device pixels): the player's Legend attacks
   * the living enemy unit under it, once (a unit is drawn on top of a roof; DEC-183). With no unit,
   * the roof of the building there is cut away or put back (DEC-150); with no roof click either,
   * the Legend attacks the map object under the point. No Legend, no attack. The view does not
   * move.
   *
   * @returns Whether a roof was toggled, so the chrome can report the roofs (DEC-150).
   */
  public clickAt(screenX: number, screenY: number): boolean {
    const { camera, commands, roofs, snapshot } = this.deps;
    const playerId = this.deps.playerId();
    const point = camera.worldAt(screenX, screenY);
    if (playerId !== null && commands.attackUnitAt(playerId, point, snapshot())) {
      return false;
    }
    if (roofs.toggleAt(point)) {
      return true;
    }
    if (playerId !== null) {
      commands.attackObjectAt(playerId, point, snapshot());
    }
    return false;
  }

  /**
   * Shows the whole battlefield in the free view and puts back every roof the developer cut away
   * (the player's building stays open).
   */
  public overview(): void {
    this.deps.camera.overview();
    this.deps.roofs.restore();
  }

  /**
   * The developer explorer was hidden: puts back the roofs the developer cut away (the player's
   * building stays open) and returns to the following camera at its base zoom, so developer state
   * does not stay in normal play (DEC-143).
   */
  public leaveExplorer(): void {
    this.deps.roofs.restore();
    this.deps.camera.leaveExplorer();
  }

  /**
   * Whether the canvas gestures own the main button's press (a minimap click, or any press with the
   * developer explorer shown): the held button is then no attack, and a plain click with the
   * explorer attacks on its release instead (`clickAt`, DEC-150; 06 §10, input arbitration).
   */
  public setPointerClaimed(isClaimed: boolean): void {
    this.deps.commands.setPointerClaimed(isClaimed);
  }
}
