const isPlainRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * `JSON.stringify(value)` with every object's keys sorted, at every depth, so two equal values
 * built in a different key order serialise the same. Arrays keep their order. Keys are compared
 * by UTF-16 code unit (no locale), so the result is the same on every machine.
 */
export const canonicalJson = (value: unknown): string =>
  JSON.stringify(value, (_key: string, inner: unknown): unknown =>
    isPlainRecord(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([left], [right]) => (left < right ? -1 : 1)))
      : inner,
  );
