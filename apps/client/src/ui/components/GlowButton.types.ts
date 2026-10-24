/** A raster's draw box in integer px relative to the button root (I-45: its size is the file's). */
export type ChromeBox = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/** Pointer states the Figma does not draw (CD-15): the chrome plate shows only while `idle`. */
export type GlowButtonInteraction = 'idle' | 'hover' | 'pressed';
