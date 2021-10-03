import { createClient } from '@lib/infrastructure/graphql/client'
import { prettify } from '../graphql/gql'

import { GraphQLAtgConfig } from './config'
import { generateGraphQLQueries } from './generator/query/queryGenerator'
import { introspect } from './introspection/introspecter'

export async function runGraphQLAtg(config: GraphQLAtgConfig) {
  const client = createClient(config.endpoint, config.headers)

  const introspectionResult = await introspect(client, config.introspection)
  const allQueries = generateGraphQLQueries(
    introspectionResult,
    config.generation
  )

  // TODO - run those queries, store the results, etc
  allQueries.forEach((query) => {
    console.log(prettify(query.query))
    console.log(query.variables)
  })
}
