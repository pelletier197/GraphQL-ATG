import { GraphQLClient, GraphQLResponse } from '@lib/core/graphql/client'
import { minify, prettify } from '@lib/core/graphql/gql'
import { GraphQLQuery } from '@lib/core/graphql/query/query'
import {
  failed,
  info,
  start,
  succeed,
} from '@lib/core/progress/progressIndicator'

import { LoggingConfig } from '../logging/config'

import { RunnerConfig } from './config'
import { createProgress, Progress } from './progress'

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
  const progress = createProgress(queries.length)

  // eslint-disable-next-line functional/no-let
  let results: ReadonlyArray<QueryExecutionResultDetails> = []

  // eslint-disable-next-line functional/no-loop-statement
  for (const query of queries) {
    results = [
      ...results,
      await runQuery(query, client, progress, loggingConfig, runnerConfig),
    ]
  }

  return {
    resultDetails: results,
    failed: results.filter((result) => !result.isSuccessful).length,
    successful: results.filter((result) => result.isSuccessful).length,
    executionTimeMilliseconds: results.reduce(
      (previous: number, current: QueryExecutionResultDetails) =>
        previous + current.executionTimeMilliseconds,
      0
    ),
  }
}

async function runQuery(
  query: GraphQLQuery,
  client: GraphQLClient,
  progress: Progress,
  loggingConfig: LoggingConfig,
  runnerConfig: RunnerConfig
): Promise<QueryExecutionResultDetails> {
  if (loggingConfig.printQueries) {
    const output = loggingConfig.prettify
      ? prettify(query.query)
      : minify(query.query)

    info(`Running query: \n${output}`)

    if (loggingConfig.printVariables) {
      const variablesOutput = loggingConfig.prettify
        ? JSON.stringify(query.variables, null, 2)
        : JSON.stringify(query.variables)

      info(`With variables: \n${variablesOutput}`)
    }
  }

  start(`Execute query ${progress.increment()}`)
  const before = new Date().getUTCMilliseconds()
  const result = await client.request(query.query, query.variables)

  if (result.errors.length > 0) {
    failed(
      `Errors were returned by the endpoint:\n${result.errors.map(
        (error) => `  - ${error.message}`
      )}`
    )

    if (runnerConfig.failFast) {
      throw new Error('reee')
    }
  } else {
    succeed()
  }

  return {
    executionTimeMilliseconds: new Date().getUTCMilliseconds() - before,
    isSuccessful: result.errors.length === 0,
    query: query,
    response: result,
  }
}
