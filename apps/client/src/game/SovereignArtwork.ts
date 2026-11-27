import type { ViewportCanvas } from './MatchViewport.types';
import type { WorldPoint } from './engine/render/Renderer.types';
import styles from './SovereignArtwork.module.css';

const percent = (value: number, size: number): string => `${String((value / size) * 100)}%`;

/** Owns the CSS portraits projected over the match canvas. */
export class SovereignArtwork {
  private readonly portraits = new Map<string, HTMLDivElement>();
  private readonly drawn = new Set<string>();

  /** Creates the projection surface without attaching anything until a King is visible. */
  public constructor(
    private readonly layer: HTMLElement,
    private readonly canvas: Pick<ViewportCanvas, 'width' | 'height'>,
  ) {}

  /** Starts a new scene draw. */
  public beginFrame(): void {
    this.drawn.clear();
  }

  /** Places the team portrait over its feet in canvas device pixels. */
  public draw(id: string, isDark: boolean, feet: WorldPoint, width: number): void {
    if (this.canvas.width <= 0 || this.canvas.height <= 0) return;
    let portrait = this.portraits.get(id);
    if (portrait === undefined) {
      portrait = this.layer.ownerDocument.createElement('div');
      portrait.className = styles.king ?? '';
      for (const part of [
        styles.ground,
        styles.cape,
        styles.legs,
        styles.shoulders,
        styles.plate,
        styles.insignia,
        styles.helm,
        styles.visor,
        styles.crown,
        styles.sword,
      ]) {
        const detail = this.layer.ownerDocument.createElement('span');
        detail.className = part ?? '';
        portrait.append(detail);
      }
      this.portraits.set(id, portrait);
      this.layer.append(portrait);
    }
    if (styles.dark !== undefined) portrait.classList.toggle(styles.dark, isDark);
    portrait.style.left = percent(feet.x, this.canvas.width);
    portrait.style.top = percent(feet.y, this.canvas.height);
    portrait.style.width = percent(width, this.canvas.width);
    this.drawn.add(id);
  }

  /** Removes portraits that died or went behind a roof. */
  public endFrame(): void {
    for (const [id, portrait] of this.portraits) {
      if (this.drawn.has(id)) continue;
      portrait.remove();
      this.portraits.delete(id);
    }
  }

  /** Releases every portrait when the match ends. */
  public destroy(): void {
    this.beginFrame();
    this.endFrame();
  }
}
