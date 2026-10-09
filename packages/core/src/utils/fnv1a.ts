/** FNV-1a 32-bit offset basis. */
const OFFSET_BASIS = 0x811c9dc5;
/** FNV-1a 32-bit prime. */
const PRIME = 0x01000193;

/**
 * 32-bit FNV-1a hash of `text`, as an unsigned integer. Steps once per UTF-16 code unit, so it
 * equals the reference byte-wise FNV-1a for ASCII input.
 */
export const fnv1a = (text: string): number => {
  let hash = OFFSET_BASIS;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, PRIME);
  }
  return hash >>> 0;
};
