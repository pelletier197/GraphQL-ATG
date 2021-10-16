import { GraphQLClient, GraphQLResponse } from '@lib/core/graphql/client'
import { minify, prettify } from '@lib/core/graphql/gql'
import { GraphQLQuery } from '@lib/core/graphql/query/query'
import { newMultiTask } from '@lib/core/progress/progressIndicator'

import { LoggingConfig } from '../logging/config'

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
   * Wether or not the request was successful
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

export async function executeQueries(
  client: GraphQLClient,
  queries: ReadonlyArray<GraphQLQuery>,
  loggingConfig: LoggingConfig,
  runnerConfig: RunnerConfig
): Promise<QueryExecutionResults> {
  const task = newMultiTask<QueryExecutionResultDetails>(
    queries.map((query, index) => {
      return {
        name: `Query ${index}`,
        run: async () => await runQuery(query, client, loggingConfig),
      }
    }),
    {
      concurrency: runnerConfig.concurrency,
      exitOnError: runnerConfig.failFast,
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
  client: GraphQLClient,
  loggingConfig: LoggingConfig
): Promise<QueryExecutionResultDetails> {
  if (loggingConfig.printQueries) {
    loggingConfig.prettify ? prettify(query.query) : minify(query.query)

    if (loggingConfig.printVariables) {
      loggingConfig.prettify
        ? JSON.stringify(query.variables, null, 2)
        : JSON.stringify(query.variables)
    }
  }

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
