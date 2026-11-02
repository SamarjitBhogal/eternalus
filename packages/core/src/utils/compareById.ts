/**
 * The total order of ids (architecture 03 §2, §8): plain string order, never numeric, so
 * `entity-10` sorts before `entity-9`. A pure, total comparator for `Array.prototype.sort`.
 */
export const compareById = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
