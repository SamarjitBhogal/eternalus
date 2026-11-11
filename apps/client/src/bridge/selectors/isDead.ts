/**
 * Whether a health reading means dead: health at 0 or below (DEC-69). Unknown health (`null`) is
 * not dead (DEC-149). The roofs (`Match`) and the structure strip share this one check (DEC-151).
 */
export const isDead = (health: { readonly current: number } | null): boolean =>
  health !== null && health.current <= 0;
