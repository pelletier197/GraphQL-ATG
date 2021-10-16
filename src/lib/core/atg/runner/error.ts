/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */

import { QueryExecutionResultDetails } from './runner'

export class FailedGraphQLRequestError extends Error {
  readonly details: QueryExecutionResultDetails

  constructor(details: QueryExecutionResultDetails) {
    super(
      `GraphQL request failed with errors \n${details.response.errors.map(
        (error) => `\t - ${error.message}`
      )}`
    )

    this.details = details
  }
}
