/** Thrown when content breaks a rule. The message lists every broken rule with its definition id. */
export class ContentValidationError extends Error {
  /** Creates the error with a message that names each definition and the broken rule. */
  public constructor(message: string) {
    super(message);
    this.name = 'ContentValidationError';
  }
}
