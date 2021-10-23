/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */

import { GraphQLResponse } from './client.js'

export class GraphQLQueryError<T> extends Error {
  readonly response: GraphQLResponse<T>

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
