import { GraphQLVariables } from '@lib/core/graphql/client'

export type GraphQLQuery = {
  readonly query: string
  readonly variables: GraphQLVariables
}
