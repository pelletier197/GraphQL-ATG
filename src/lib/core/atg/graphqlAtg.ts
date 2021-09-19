import { createClient } from '@lib/infrastructure/graphql/client'

import { GraphQLAtgConfig } from './config'
import { GeneratorConfig } from './generator/config'
import { generateGraphQLQueries } from './generator/query/queryGenerator'
import { introspect } from './introspection/introspecter'

export type GraphQLAtg = {
  readonly run: () => Promise<void>
}

export function createGraphQLAtg(config: GraphQLAtgConfig): GraphQLAtg {
  const client = createClient(config.endpoint, config.headers)

  return {
    run: async () => {
      const introspectionResult = await introspect(client, config.introspection)
      const allQueries = generateGraphQLQueries(
        introspectionResult,
        config.generation
      )
      // TODO - run those queries, store the results, etc
      console.log(allQueries)
    },
  }
}
