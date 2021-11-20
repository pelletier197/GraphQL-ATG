import { GraphQLClient, GraphQLResponse } from '@lib/core/graphql/client.js'
import { GraphQLQuery } from '@lib/core/graphql/query/query.js'
import { newMultiTask, TaskContext } from '@lib/core/task/task.js'
import _ from 'lodash'

import { RunnerConfig } from './config.js'
import { FailedGraphQLRequestError } from './error.js'
import { HookCallback, RunnerHook, RunnerHookContext } from './hooks/hook.js'

export enum QueryExecutionStatus {
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export type QueryExecutionResultDetails = {
  /**
   * The index of the query in the list of queries to execute
   */
  readonly index: number
  /**
   * The query that was executed during this test
   */
  readonly query: GraphQLQuery
  /**
   * Wether the task was successful, failed or was skipped
   */
  readonly status: QueryExecutionStatus
  /**
   * This response received when sending the query
   */
  readonly response?: GraphQLResponse<unknown>
  /**
   * The number of time the request took to complete in ms
   */
  readonly executionTimeMilliseconds?: number
}

export type QueryExecutionResults = {
  /**
   * The result details for each query executed
   */
  readonly resultDetails: ReadonlyArray<QueryExecutionResultDetails>

  /**
   * The number of successful requests
   */
  readonly successful: number

  /**
   * The number of failed requests
   */
  readonly failed: number

  /**
   * The number of skipped requests
   */
  readonly skipped: number

  /**
   * The total execution time for all the test suite.
   */
  readonly executionTimeMilliseconds: number
}

const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  concurrency: 1,
  failFast: false,
  hooks: [],
}

export async function executeQueries(
  client: GraphQLClient,
  queries: ReadonlyArray<GraphQLQuery>,
  config?: Partial<RunnerConfig>
): Promise<QueryExecutionResults> {
  const actualConfig = Object.assign({}, DEFAULT_RUNNER_CONFIG, config)

  const task = newMultiTask<QueryExecutionResultDetails>(
    queries.map((query, index) => {
      return {
        name: `Query ${index + 1}`,
        run: async (context) =>
          await runQuery(index, query, client, context, actualConfig.hooks),
      }
    }),
    {
      concurrency: actualConfig.concurrency,
      exitOnError: actualConfig.failFast,
      name: 'Executing auto-generated queries',
    }
  )

  const multiTaskResult = await task.start()
  const results = multiTaskResult.results
  const errors = multiTaskResult.errors.map((error) => convertError(error))

  const allExpectedIndexes = queries.map((_, index) => index)
  const allReceivedIndexes = [...results, ...errors].map(
    (detail) => detail.index
  )

  const allDetails = _.sortBy(
    [
      ...results,
      ...errors,
      ..._.difference(allExpectedIndexes, allReceivedIndexes).map((index) =>
        createSkippedResult(index, queries[index])
      ),
    ],
    (detail) => detail.index
  )

  return {
    resultDetails: allDetails,
    failed: allDetails.filter(
      (result) => result.status === QueryExecutionStatus.FAILED
    ).length,
    successful: allDetails.filter(
      (result) => result.status === QueryExecutionStatus.SUCCESSFUL
    ).length,
    skipped: allDetails.filter(
      (result) => result.status === QueryExecutionStatus.SKIPPED
    ).length,
    executionTimeMilliseconds: allDetails.reduce(
      (previous: number, current: QueryExecutionResultDetails) =>
        previous + (current.executionTimeMilliseconds || 0),
      0
    ),
  }
}

function convertError(error: unknown): QueryExecutionResultDetails {
  if (error instanceof FailedGraphQLRequestError) {
    return error.details
  }

  throw error
}

function createSkippedResult(
  index: number,
  query: GraphQLQuery
): QueryExecutionResultDetails {
  return {
    status: QueryExecutionStatus.SKIPPED,
    query,
    index,
    response: undefined,
    executionTimeMilliseconds: undefined,
  }
}

async function notifyHooks(
  hooks: ReadonlyArray<RunnerHook>,
  context: RunnerHookContext,
  extractor: (hook: RunnerHook) => HookCallback | undefined
) {
  return await Promise.all(
    hooks.map(async (hook) => {
      const callback = extractor(hook)
      if (callback) {
        return await callback(context)
      }
    })
  )
}

async function runQuery(
  index: number,
  query: GraphQLQuery,
  client: GraphQLClient,
  context: TaskContext,
  hooks: ReadonlyArray<RunnerHook>
): Promise<QueryExecutionResultDetails> {
  const hookContext: RunnerHookContext = {
    query: query,
    task: context,
  }

  notifyHooks(hooks, hookContext, (hook) => hook.beforeTest)

  const before = new Date().getUTCMilliseconds()
  const result = await client.request(query.query, query.variables)

  const details: QueryExecutionResultDetails = {
    index: index,
    executionTimeMilliseconds: new Date().getUTCMilliseconds() - before,
    status:
      result.errors.length === 0
        ? QueryExecutionStatus.SUCCESSFUL
        : QueryExecutionStatus.FAILED,
    query: query,
    response: result,
  }

  if (details.status !== QueryExecutionStatus.SUCCESSFUL) {
    notifyHooks(hooks, hookContext, (hook) => hook.onFail)
    throw new FailedGraphQLRequestError(details)
  }

  notifyHooks(hooks, hookContext, (hook) => hook.onSuccess)
  return details
}
