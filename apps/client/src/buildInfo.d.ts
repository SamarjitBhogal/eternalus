// Set by Vite `define` in vite.config.ts at serve and build time (ADR 0025 §3).

/** The root `package.json` version. */
declare const __GAME_VERSION__: string;

/** The short git commit the page was served or built from, or `'unknown'`. */
declare const __GAME_COMMIT__: string;
