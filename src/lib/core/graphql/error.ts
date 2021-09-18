/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */

import { GraphQLError, GraphQLResponse } from './client'

export class GraphQLQueryError<T> extends Error {
  private readonly response: GraphQLResponse<T>

  constructor(message: string, response: GraphQLResponse<T>) {
    const errorsFormatted = response.errors
      ?.map((error) => `\t- ${error.message}`)
      ?.join('\n')

    super(`
${message}
--------------------------------
Data: ${response.data}
Errors: 
${errorsFormatted}
    `)

    this.response = response
  }
}
