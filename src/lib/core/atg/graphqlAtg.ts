import { createClient } from '@lib/infrastructure/graphql/client'

import { GraphQLAtgConfig } from './config'
import { generateGraphQLQueries } from './generator/query/queryGenerator'
import { introspect } from './introspection/introspecter'
import { executeQueries } from './runner/runner'

export async function runGraphQLAtg(config: GraphQLAtgConfig) {
  const client = createClient(config.endpoint, config.headers)

  const introspectionResult = await introspect(client, config.introspection)
  const allQueries = await generateGraphQLQueries(
    introspectionResult,
    config.generation
  )
  await executeQueries(client, allQueries, {
    concurrency: 3,
    failFast: false,
  })
  // TODO - run those queries, store the results, etc
  allQueries.forEach(() => {
    // console.log(prettify(query.query))
    // console.log(query.variables)
  })
}
