/**
 * The Legend step's local rule, pure (precedent `classStepState.ts`): which Legend the panel and
 * the rating bars show. Nothing here is game data and nothing is emitted.
 */

/** One card as the rule sees it: its Legend and whether the player picked it. */
type ShownLegendCard = { readonly specId: string; readonly isPicked: boolean };

/**
 * The Legend the panel shows: the one a hover or focus previews (`previewSpecId`, any card, a
 * locked one included), else the picked one, else the first card, else `null` for an empty list.
 * A preview id the list does not have counts as no preview.
 */
export function shownLegend<TCard extends ShownLegendCard>(
  legends: readonly TCard[],
  previewSpecId: string | null,
): TCard | null {
  return (
    legends.find((legend) => legend.specId === previewSpecId) ??
    legends.find((legend) => legend.isPicked) ??
    legends[0] ??
    null
  );
}
