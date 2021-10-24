import { GraphQLClient, GraphQLResponse } from '@lib/core/graphql/client.js'
import { GraphQLQuery } from '@lib/core/graphql/query/query.js'
import { newMultiTask, TaskContext } from '@lib/core/task/task.js'

import { RunnerConfig } from './config.js'
import { FailedGraphQLRequestError } from './error.js'
import { HookCallback, RunnerHook, RunnerHookContext } from './hooks/hook.js'

export type QueryExecutionResultDetails = {
  /**
   * The query that was executed during this test
   */
  readonly query: GraphQLQuery
  /**
   * This response received when sending the query
   */
  readonly response: GraphQLResponse<unknown>
  /**
   * WetherTaskContext or not the request was successful
   */
  readonly isSuccessful: boolean
  /**
   * The number of time the request took to complete in ms
   */
  readonly executionTimeMilliseconds: number
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
   * The total execution time for all the test suite.
   */
  readonly executionTimeMilliseconds: number
}

const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  concurrency: 1,
  failFast: false,
}

export async function executeQueries(
  client: GraphQLClient,
  queries: ReadonlyArray<GraphQLQuery>,
  hooks: ReadonlyArray<RunnerHook>,
  config?: Partial<RunnerConfig>
): Promise<QueryExecutionResults> {
  const actualConfig = Object.assign({}, DEFAULT_RUNNER_CONFIG, config)

  const task = newMultiTask<QueryExecutionResultDetails>(
    queries.map((query, index) => {
      return {
        name: `Query ${index + 1}`,
        run: async (context) => await runQuery(query, client, context, hooks),
      }
    }),
    {
      concurrency: actualConfig.concurrency,
      exitOnError: actualConfig.failFast,
      name: 'Executing auto-generated queries',
    }
  )

  try {
    const multiTaskResult = await task.start()
    const allDetails = [
      ...multiTaskResult.results,
      ...multiTaskResult.errors.map((error) => convertError(error)),
    ]
    return {
      resultDetails: allDetails,
      failed: allDetails.filter((result) => !result.isSuccessful).length,
      successful: allDetails.filter((result) => result.isSuccessful).length,
      executionTimeMilliseconds: allDetails.reduce(
        (previous: number, current: QueryExecutionResultDetails) =>
          previous + current.executionTimeMilliseconds,
        0
      ),
    }
  } catch (error) {
    const converted = convertError(error)

    return {
      executionTimeMilliseconds: converted.executionTimeMilliseconds,
      failed: 1,
      successful: 0,
      resultDetails: [converted],
    }
  }
}

function convertError(error: unknown): QueryExecutionResultDetails {
  if (error instanceof FailedGraphQLRequestError) {
    return error.details
  }

  throw error
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

  const details = {
    executionTimeMilliseconds: new Date().getUTCMilliseconds() - before,
    isSuccessful: result.errors.length === 0,
    query: query,
    response: result,
  }

  if (result.errors.length > 0) {
    notifyHooks(hooks, hookContext, (hook) => hook.onFail)
    throw new FailedGraphQLRequestError(details)
  }

  notifyHooks(hooks, hookContext, (hook) => hook.onSuccess)
  return details
}
