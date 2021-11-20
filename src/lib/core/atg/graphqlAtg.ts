import { createClient } from '@lib/infrastructure/graphql/client.js'

import { GraphQLAtgConfig } from './config.js'
import { generateGraphQLQueries } from './generator/query/queryGenerator.js'
import { introspect } from './introspection/introspecter.js'
import { executeQueries, QueryExecutionResults } from './runner/runner.js'

export async function runGraphQLAtg(
  config: GraphQLAtgConfig
): Promise<QueryExecutionResults> {
  const client = createClient(config.endpoint, config.headers)

  const introspectionResult = await introspect(client, config.introspection)
  const allQueries = await generateGraphQLQueries(
    introspectionResult,
    config.generation
  )
  return await executeQueries(client, allQueries, config.runner)
}
