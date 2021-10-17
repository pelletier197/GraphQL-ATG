import { createClient } from '@lib/infrastructure/graphql/client'

import { GraphQLAtgConfig } from './config'
import { generateGraphQLQueries } from './generator/query/queryGenerator'
import { introspect } from './introspection/introspecter'
import { executeQueries, QueryExecutionResults } from './runner/runner'

export async function runGraphQLAtg(
  config: GraphQLAtgConfig
): Promise<QueryExecutionResults> {
  const client = createClient(config.endpoint, config.headers)

  const introspectionResult = await introspect(client, config.introspection)
  const allQueries = await generateGraphQLQueries(
    introspectionResult,
    config.generation
  )
  return await executeQueries(client, allQueries, {
    concurrency: 3,
    failFast: false,
  })
}
