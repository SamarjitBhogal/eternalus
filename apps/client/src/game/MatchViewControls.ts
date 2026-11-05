import type { MatchViewControlsDeps } from './MatchViewControls.types';

/**
 * What the canvas gestures (`CanvasPointerControls`) do to one match: move, drag and zoom the
 * camera, look at a minimap point, cut away or put back roofs in the developer explorer, attack
 * on a plain explorer click, and claim the main button's press (06 §10). `Match` builds it from
 * its camera, roofs, player commands and minimap, and stays the composition root (DEC-139, INBOX
 * HC-S6). Positions arrive in device pixels.
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

  /** Drags the view by a screen offset (device pixels), switching to the free view. */
  public panBy(screenDx: number, screenDy: number): void {
    this.deps.camera.panBy(screenDx, screenDy);
  }

  /** Zooms whichever view is on screen; `factor` above 1 zooms in. */
  public zoomBy(factor: number): void {
    this.deps.camera.zoomBy(factor);
  }

  /**
   * The developer explorer's click: cuts away the roof of the building under the screen point
   * (device pixels), or puts back one it cut away. The view does not move.
   * @returns Whether a roof was toggled: not on open ground or the player's building (DEC-150).
   */
  public toggleRoofAt(screenX: number, screenY: number): boolean {
    const { roofs, camera } = this.deps;
    return roofs.toggleAt(camera.worldAt(screenX, screenY));
  }

  /**
   * The explorer's plain click that is no roof click (DEC-150): the player's Legend attacks the
   * living map object under the screen point (device pixels), once; no Legend, no attack.
   */
  public attackAt(screenX: number, screenY: number): void {
    const { playerId, camera, commands, mapObjects } = this.deps;
    if (playerId === null) return;
    commands.attackAt(playerId, camera.worldAt(screenX, screenY), mapObjects());
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
   * explorer attacks on its release instead (`attackAt`, DEC-150; 06 §10, input arbitration).
   */
  public setPointerClaimed(isClaimed: boolean): void {
    this.deps.commands.setPointerClaimed(isClaimed);
  }
}
