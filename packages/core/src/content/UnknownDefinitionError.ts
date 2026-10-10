/** Thrown when a content id is looked up but no definition has that id. */
export class UnknownDefinitionError extends Error {
  /** Creates the error for the missing `definitionId`. */
  public constructor(public readonly definitionId: string) {
    super(`Unknown definition id "${definitionId}".`);
    this.name = 'UnknownDefinitionError';
  }
}
