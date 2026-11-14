/** A decoded, owned atlas; ResourceController releases its bitmap with the match group. */
export class SpriteAtlasAsset {
  /** Associates the decoded bitmap with its uniform frame grid. */
  public constructor(
    public readonly image: ImageBitmap,
    public readonly columns: number,
    public readonly rows: number,
  ) {}
}
