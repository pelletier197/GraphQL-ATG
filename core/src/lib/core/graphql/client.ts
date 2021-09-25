export type GraphQLClient = {
  readonly request: <T>(
    query: string,
    variables?: GraphQLVariables
  ) => Promise<GraphQLResponse<T>>
}

export type GraphQLResponse<T> = {
  readonly errors: ReadonlyArray<GraphQLError>
  readonly data?: T
}

export type GraphQLVariables = {
  readonly [key: string]: unknown
}

export type GraphQLError = {
  readonly message: string
  readonly locations?: ReadonlyArray<GraphQLLocation>
  readonly path?: ReadonlyArray<string>
}

export type GraphQLLocation = {
  readonly line: number
  readonly column: number
}
