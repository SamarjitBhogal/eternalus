/** The selection artboard in CSS px: Figma 62:125, 62:70 and 58:271 are 1920 × 1080 frames. */
const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;

/**
 * The uniform factor that fits the 1920 × 1080 selection artboard into `width` × `height` CSS px,
 * letterboxed and never cropped (I-13): 1 at 1920 × 1080, 2 at 3840 × 2160, 2/3 at 1280 × 720.
 */
export function fitStageScale(width: number, height: number): number {
  return Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
}

/**
 * A runtime font size in artboard px, in the selection screens' I-51 form (the form every Cinzel
 * module rule has): never below `--text-min` on screen, whatever `--stage-scale`.
 */
export function stageFontSize(px: number): string {
  return `max(${String(px)}px, calc(var(--text-min) / var(--stage-scale)))`;
}
