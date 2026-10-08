/**
 * Where the factory finds the definition named by a `definitionId`. A `ContentCatalogue`
 * satisfies it; the factory depends on this port, not on a catalogue (dependency inversion).
 */
export interface DefinitionSource {
  /** Whether a definition has the id `id`. */
  has(id: string): boolean;
  /** The definition with the id `id`; called only after `has(id)` returned true. */
  get(id: string): object;
}
