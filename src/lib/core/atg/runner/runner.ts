import { GraphQLClient, GraphQLResponse } from '@lib/core/graphql/client'
import { GraphQLQuery } from '@lib/core/graphql/query/query'
import { newMultiTask } from '@lib/core/task/task'

import { RunnerConfig } from './config'
import { FailedGraphQLRequestError } from './error'

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
  config?: Partial<RunnerConfig>
): Promise<QueryExecutionResults> {
  const actualConfig = Object.assign({}, DEFAULT_RUNNER_CONFIG, config)

  const task = newMultiTask<QueryExecutionResultDetails>(
    queries.map((query, index) => {
      return {
        name: `Query ${index + 1}`,
        run: async () => await runQuery(query, client),
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

async function runQuery(
  query: GraphQLQuery,
  client: GraphQLClient
): Promise<QueryExecutionResultDetails> {
  const before = new Date().getUTCMilliseconds()
  const result = await client.request(query.query, query.variables)

  const details = {
    executionTimeMilliseconds: new Date().getUTCMilliseconds() - before,
    isSuccessful: result.errors.length === 0,
    query: query,
    response: result,
  }

  if (result.errors.length > 0) {
    throw new FailedGraphQLRequestError(details)
  }

  return details
}