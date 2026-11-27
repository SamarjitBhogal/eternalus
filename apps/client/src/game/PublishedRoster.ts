/**
 * One HUD roster as `MatchBridge` last published it (DEC-221 (3), DEC-222): a re-send keeps the
 * last published object for each item that did not change, and the last array itself while no
 * item did, so the roster selectors return the same value and the HUD does not re-render.
 */
export class PublishedRoster<Item> {
  private last: readonly Item[];

  /**
   * @param initial - The roster before the first publish.
   * @param isSame - Whether `next` shows the same as `last`, the item at its index last time.
   */
  public constructor(
    initial: readonly Item[],
    private readonly isSame: (last: Item, next: Item) => boolean,
  ) {
    this.last = initial;
  }

  /**
   * The roster to publish for `next`, which it remembers as the last one: each item that
   * `isSame` as the item at its index in the last roster is that last object, and the result is
   * the last array itself when every item is and the length did not change.
   */
  public update(next: readonly Item[]): readonly Item[] {
    const kept = next.map((item, index) => {
      const previous = this.last[index];
      return previous !== undefined && this.isSame(previous, item) ? previous : item;
    });
    if (kept.length !== this.last.length || kept.some((item, index) => item !== this.last[index])) {
      this.last = kept;
    }
    return this.last;
  }
}
