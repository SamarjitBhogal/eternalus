import { atlasWithFrame } from './atlasWithFrame';
import type { Renderer } from './Renderer';
import type { AtlasShape } from './Renderer.types';
import type { RecordedCall } from './RecordingRenderer.types';
import { spriteTopOf } from './spriteMeasures';

/**
 * A `Renderer` that draws nothing and records every call, in order (architecture 09 §1: every
 * port has a recording fake). Tests use it to check what a view asked the screen to do
 * without a canvas. `toScreen` returns the point unchanged; `hasSprite` and `spriteTop` answer by the same rules
 * as `Canvas2dRenderer` (`atlasWithFrame`, `spriteTopOf`) for the atlas shapes it is given. Narrow
 * `calls` on `op` to read a call's arguments with their types.
 */
export class RecordingRenderer implements Renderer {
  /** Every call so far, oldest first. */
  public readonly calls: RecordedCall[] = [];

  /** Creates a recorder that holds the given atlas shapes by manifest id (none by default). */
  public constructor(private readonly atlases: Readonly<Record<string, AtlasShape>> = {}) {}

  /** Records the call. */
  public drawSprite(...args: Parameters<Renderer['drawSprite']>): void {
    this.calls.push({ op: 'drawSprite', args });
  }

  /** Records the call and answers whether one of its atlas grids holds the frame. */
  public hasSprite(...args: Parameters<Renderer['hasSprite']>): boolean {
    this.calls.push({ op: 'hasSprite', args });
    return atlasWithFrame(this.atlases, args[0]) !== undefined;
  }

  /** Records the call and answers by `Canvas2dRenderer`'s rule for its atlas shapes. */
  public spriteTop(...args: Parameters<Renderer['spriteTop']>): number | null {
    this.calls.push({ op: 'spriteTop', args });
    const [sprite, width] = args;
    const atlas = atlasWithFrame(this.atlases, sprite);
    return atlas === undefined ? null : spriteTopOf(atlas, width);
  }

  /** Records the call. */
  public resize(...args: Parameters<Renderer['resize']>): void {
    this.calls.push({ op: 'resize', args });
  }

  /** Records the call. */
  public showWorldArea(...args: Parameters<Renderer['showWorldArea']>): void {
    this.calls.push({ op: 'showWorldArea', args });
  }

  /** Records the call. */
  public clear(...args: Parameters<Renderer['clear']>): void {
    this.calls.push({ op: 'clear', args });
  }

  /** Records the call. */
  public fillScreenRect(...args: Parameters<Renderer['fillScreenRect']>): void {
    this.calls.push({ op: 'fillScreenRect', args });
  }

  /** Records the call. */
  public strokeScreenRect(...args: Parameters<Renderer['strokeScreenRect']>): void {
    this.calls.push({ op: 'strokeScreenRect', args });
  }

  /** Records the call, then runs `draw`, so the calls it makes follow it in `calls`. */
  public clipToEllipse(...args: Parameters<Renderer['clipToEllipse']>): void {
    this.calls.push({ op: 'clipToEllipse', args });
    args[1]();
  }

  /** Records the call. */
  public fillPolygon(...args: Parameters<Renderer['fillPolygon']>): void {
    this.calls.push({ op: 'fillPolygon', args });
  }

  /** Records the call. */
  public strokePath(...args: Parameters<Renderer['strokePath']>): void {
    this.calls.push({ op: 'strokePath', args });
  }

  /** Records the call. */
  public drawWorldGlyph(...args: Parameters<Renderer['drawWorldGlyph']>): void {
    this.calls.push({ op: 'drawWorldGlyph', args });
  }

  /** Records the call. */
  public drawGlyph(...args: Parameters<Renderer['drawGlyph']>): void {
    this.calls.push({ op: 'drawGlyph', args });
  }

  /** Records the call and returns the point unchanged. */
  public toScreen(...args: Parameters<Renderer['toScreen']>): ReturnType<Renderer['toScreen']> {
    this.calls.push({ op: 'toScreen', args });
    return args[0];
  }

  /** Records the call. */
  public destroy(): void {
    this.calls.push({ op: 'destroy', args: [] });
  }
}
