export type RunnerConfig = {
  /**
   * Activating the fail fast mode will make the tests end as soon as an error will be returned by one of the query, stopping the other requests from being executed.
   */
  readonly failFast: boolean

  /**
   * The maximum number of asynchronous requests that can be performed.
   */
  readonly concurrency: number
}
