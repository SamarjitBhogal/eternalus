/** Decorative landforms do not change capture rules or collision. */
export const LAKES = [
  { x: 460, y: 515, rx: 73, ry: 37 },
  { x: 1135, y: 520, rx: 78, ry: 40 },
  { x: 585, y: 185, rx: 45, ry: 23 },
] as const;
/** Local snow pockets around the northern fortress. */
export const SNOW_PATCHES = [
  { x: 695, y: 90, rx: 85, ry: 55 },
  { x: 895, y: 95, rx: 95, ry: 64 },
  { x: 740, y: 174, rx: 60, ry: 38 },
  { x: 875, y: 190, rx: 69, ry: 41 },
  { x: 805, y: 43, rx: 70, ry: 30 },
] as const;
/** Lava channels wrap around the southern fortress. */
export const LAVA_RIVERS = [
  [
    { x: 610, y: 880 },
    { x: 655, y: 850 },
    { x: 670, y: 815 },
    { x: 645, y: 774 },
    { x: 690, y: 747 },
    { x: 735, y: 730 },
    { x: 805, y: 741 },
    { x: 865, y: 719 },
    { x: 925, y: 738 },
    { x: 959, y: 770 },
    { x: 942, y: 820 },
    { x: 987, y: 850 },
    { x: 1020, y: 880 },
  ],
  [
    { x: 675, y: 824 },
    { x: 712, y: 854 },
    { x: 768, y: 870 },
    { x: 815, y: 860 },
    { x: 870, y: 873 },
    { x: 947, y: 834 },
  ],
] as const;
/** Major landmark dimensions in original sketch coordinates. */
export const LANDMARK_SETTINGS = {
  cathedralHalfWidth: 100,
  cathedralHalfHeight: 118,
  strongholdWidth: 220,
  strongholdHeight: 250,
  interiorWidth: 1800,
  interiorHeight: 2200,
} as const;
