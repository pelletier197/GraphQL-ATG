export type LoggingConfig = {
  /**
   * Wether to print the queries at the moment of running or not
   */
  readonly printQueries: boolean
  /**
   * Wether to print the variables at the moment of running or not. This parameter is ignored if `printQueries` is not set to true.
   */
  readonly printVariables: boolean
  /**
   * Wether to prettify the queries and variables when printing them. When set to false, queries and variables are minified.
   */
  readonly prettify: boolean
}
