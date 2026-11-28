/** A decoded, owned atlas; ResourceController releases its bitmap with its group. */
export class SpriteAtlasAsset {
  /**
   * Associates the decoded bitmap with its uniform frame grid and where the feet stand in a cell
   * (`groundOffset`, a share of the cell's height above its bottom edge).
   */
  public constructor(
    public readonly image: ImageBitmap,
    public readonly columns: number,
    public readonly rows: number,
    public readonly groundOffset: number,
  ) {}
}
