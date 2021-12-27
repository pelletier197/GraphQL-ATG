/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */

import util from 'util'

export class InvalidGraphQLResponseException extends Error {
  readonly response: unknown

  constructor(server: string, response: object) {
    const json = util.inspect(response, {
      showHidden: false,
      depth: null,
      breakLength: 100,
      customInspect: true,
      colors: true,
      compact: false,
    })

    super(
      `Received an invalid GraphQL response from the remote server: ${server}\n${json}`
    )
    this.response = response
  }
}
