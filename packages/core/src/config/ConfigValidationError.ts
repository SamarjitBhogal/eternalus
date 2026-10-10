/**
 * Thrown by `validateGameConfig()` for the first field that breaks a rule, so a config typo fails
 * at boot with the field named, not mid-match.
 */
export class ConfigValidationError extends Error {
  /**
   * @param path - Dotted path of the offending field, e.g. `map.numLanes`.
   * @param rule - What the field must be, e.g. `must be an odd whole number >= 1`.
   */
  public constructor(
    public readonly path: string,
    public readonly rule: string,
  ) {
    super(`Invalid game config: ${path} ${rule}`);
    this.name = 'ConfigValidationError';
  }
}
