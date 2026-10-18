import type { DrawContext } from './engine/render/Canvas2dRenderer.types';
import { FakeBrowserTarget } from './FakeBrowserTarget';
import type { ViewportCanvas } from './MatchViewport.types';

/**
 * Test double for the match canvas (02 §8): a `FakeBrowserTarget` with a canvas's size, layout
 * box and pointer capture, whose 2D context is a silent fake (or `null`, a browser that cannot
 * draw). Its drawing size starts at 0 × 0 until the host sizes it.
 */
export class FakeViewportCanvas extends FakeBrowserTarget implements ViewportCanvas {
  public width = 0;

  public height = 0;

  /** The pointer ids captured now. */
  public readonly capturedPointers = new Set<number>();

  /**
   * Creates a canvas laid out at `clientWidth` × `clientHeight` CSS pixels.
   * @param context - What `getContext('2d')` returns; `null` stands for no 2D support.
   */
  public constructor(
    public readonly clientWidth = 1280,
    public readonly clientHeight = 720,
    private readonly context: DrawContext | null = FakeViewportCanvas.silentContext(),
  ) {
    super();
  }

  /** The layout box at the page's top-left corner. */
  public getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
    return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight };
  }

  /** Records the capture. */
  public setPointerCapture(pointerId: number): void {
    this.capturedPointers.add(pointerId);
  }

  /** Whether `pointerId` is captured. */
  public hasPointerCapture(pointerId: number): boolean {
    return this.capturedPointers.has(pointerId);
  }

  /** Forgets the capture. */
  public releasePointerCapture(pointerId: number): void {
    this.capturedPointers.delete(pointerId);
  }

  /** The 2D context given at construction. */
  public getContext(): DrawContext | null {
    return this.context;
  }

  /** A 2D context that draws nothing. */
  private static silentContext(): DrawContext {
    const ignore = (): void => undefined;
    return {
      beginPath: ignore,
      clip: ignore,
      closePath: ignore,
      ellipse: ignore,
      fill: ignore,
      fillRect: ignore,
      lineTo: ignore,
      moveTo: ignore,
      rect: ignore,
      restore: ignore,
      save: ignore,
      stroke: ignore,
      strokeRect: ignore,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineJoin: 'miter',
    };
  }
}
