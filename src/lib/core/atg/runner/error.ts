/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */

import { minify, prettify } from '@lib/core/graphql/gql.js'

import { QueryExecutionResultDetails } from './runner.js'

export class FailedGraphQLRequestError extends Error {
  readonly details: QueryExecutionResultDetails

  constructor(details: QueryExecutionResultDetails) {
    // When running in interactive mode, logs details in one line
    const tty = process.stdout.isTTY

    super(
      `GraphQL request failed with errors 
${details.response.errors.map((error) => `    - ${error.message}`)}

Query: ${tty ? minify(details.query.query) : prettify(details.query.query)}

Variables: ${
        tty
          ? JSON.stringify(details.query.variables)
          : JSON.stringify(details.query.variables, null, 2)
      }
      `
    )

    this.details = details
  }
}
