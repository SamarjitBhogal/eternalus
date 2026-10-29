import type { CapturePointSnapshot } from '@eternalus/core';

/** Zone colour per owner (design doc art theme: Light = gold, Dark = red). */
export const CAPTURE_TEAM_COLORS: Readonly<Record<CapturePointSnapshot['owner'], string>> = {
  light: '#6db9bc',
  dark: '#aa718f',
  neutral: '#d5b77b',
};

/** Alpha suffix (#RRGGBBAA) for the zone's tinted fill. */
export const CAPTURE_FILL_ALPHA = '40';
/** Colour behind the progress bar. */
export const CAPTURE_BAR_BACKGROUND = '#000000aa';
/** Checkpoint marks and the contested flash. */
export const CAPTURE_HIGHLIGHT_COLOR = '#ffffff';
/** Dark overlay on a locked zone. */
export const CAPTURE_LOCKED_OVERLAY = '#00000088';
/** Zone border width, in screen pixels. */
export const CAPTURE_BORDER_WIDTH = 3;
/** Progress bar height and gap above the zone, as a fraction of the zone's side. */
export const CAPTURE_BAR_HEIGHT_RATIO = 0.08;
export const CAPTURE_BAR_GAP_RATIO = 0.04;
/** The contested border flashes on and off every this many ticks. */
export const CAPTURE_FLASH_TICKS = 5;
/** Checkpoints the bar is split into (matches core's capture rules). */
export const CAPTURE_CHECKPOINTS = 3;
