import type { Renderer } from './Renderer';
import type { RecordedCall } from './RecordingRenderer.types';

/**
 * A `Renderer` that draws nothing and records every call, in order (architecture 09 §1: every
 * port has a recording fake). Tests use it to check what a view asked the screen to do
 * without a canvas. `toScreen` returns the point unchanged. Narrow `calls` on `op` to read a
 * call's arguments with their types.
 */
export class RecordingRenderer implements Renderer {
  /** Every call so far, oldest first. */
  public readonly calls: RecordedCall[] = [];

  /** Records the call. */
  public resize(...args: Parameters<Renderer['resize']>): void {
    this.calls.push({ op: 'resize', args });
  }

  /** Records the call. */
  public fitWorld(...args: Parameters<Renderer['fitWorld']>): void {
    this.calls.push({ op: 'fitWorld', args });
  }

  /** Records the call. */
  public fitWorldInArea(...args: Parameters<Renderer['fitWorldInArea']>): void {
    this.calls.push({ op: 'fitWorldInArea', args });
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

  /** Records the call. */
  public fillPolygon(...args: Parameters<Renderer['fillPolygon']>): void {
    this.calls.push({ op: 'fillPolygon', args });
  }

  /** Expands a batch into its individual polygons so geometry assertions stay precise. */
  public fillPolygons(...[shapes, color]: Parameters<Renderer['fillPolygons']>): void {
    for (const shape of shapes) this.fillPolygon(shape, color);
  }

  /** Draws the layer directly so tests retain every geometry assertion. */
  public drawCachedLayer(_key: object, _revision: number, draw: () => void): void {
    draw();
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
