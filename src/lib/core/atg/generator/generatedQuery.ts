import { GraphQLVariables } from '@lib/core/graphql/client'

export type GeneratedGraphQLQuery = {
  readonly query: string
  readonly variables: GraphQLVariables
}
