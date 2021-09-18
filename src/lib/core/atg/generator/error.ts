/* eslint-disable functional/no-class */

export class GraphQLGenerationError extends Error {
  constructor(message: string) {
    super(message)
  }
}
