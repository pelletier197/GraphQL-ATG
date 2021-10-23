import { GraphQLVariables } from '@lib/core/graphql/client.js'

export type GraphQLQuery = {
  readonly query: string
  readonly variables: GraphQLVariables
}
