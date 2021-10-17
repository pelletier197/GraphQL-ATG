/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */

import { prettify } from '@lib/core/graphql/gql'

import { QueryExecutionResultDetails } from './runner'

export class FailedGraphQLRequestError extends Error {
  readonly details: QueryExecutionResultDetails

  constructor(details: QueryExecutionResultDetails) {
    super(
      `
GraphQL request failed with errors 
${details.response.errors.map((error) => `   - ${error.message}`)}

Query: ${prettify(details.query.query)}
Variables: ${JSON.stringify(details.query.variables, null, 2)}
      `
    )

    this.details = details
  }
}
