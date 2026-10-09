/** Thrown when a map config, preset or generated map breaks a rule. The message names the rule. */
export class MapGenerationError extends Error {
  /** Creates the error with a message that names the field or feature and the broken rule. */
  public constructor(message: string) {
    super(message);
    this.name = 'MapGenerationError';
  }
}
