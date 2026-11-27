/**
 * `color` (a six-digit hex colour, `#rrggbb`) with an opacity, as an eight-digit hex colour the
 * canvas reads (`#rrggbbaa`).
 *
 * @param opacity - 0 (clear) to 1 (solid); values outside are clamped.
 */
export const colorWithAlpha = (color: string, opacity: number): string => {
  const byte = Math.round(Math.min(1, Math.max(0, opacity)) * 255);
  return `${color}${byte.toString(16).padStart(2, '0')}`;
};
