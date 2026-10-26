/** The handlers a selection card spreads onto its button to drive its panel preview. */
type PreviewHandlers = {
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onPointerEnter: () => void;
  readonly onPointerLeave: () => void;
};

/**
 * A card's hover and focus preview (the class and Legend cards): focus and pointer enter start it
 * (`onPreview(true)`), blur and pointer leave end it (`onPreview(false)`).
 */
export function previewHandlers(onPreview: (isPreviewing: boolean) => void): PreviewHandlers {
  const start = (): void => {
    onPreview(true);
  };
  const end = (): void => {
    onPreview(false);
  };
  return { onFocus: start, onBlur: end, onPointerEnter: start, onPointerLeave: end };
}
