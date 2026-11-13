/** Whether `value` is a plain object (not `null`, not an array): the first check of every stored record. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
