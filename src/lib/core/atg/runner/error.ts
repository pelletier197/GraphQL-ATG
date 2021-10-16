/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */

import { minify } from '@lib/core/graphql/gql'
import { QueryExecutionResultDetails } from './runner'

export class FailedGraphQLRequestError extends Error {
  readonly details: QueryExecutionResultDetails

  constructor(details: QueryExecutionResultDetails) {
    super(
      `GraphQL request failed with errors \n${details.response.errors.map(
        (error) => `\t - ${error.message}`
      )}
      
      Query: ${minify(details.query.query)}
      Variables: ${JSON.stringify(details.query.variables)}
      `
    )

    this.details = details
  }
}
