import { GraphQLClient } from '@lib/core/graphql/client'
import { GraphQLQueryError } from '@lib/core/graphql/error'
import { failed, start, succeed } from '@lib/core/progress/progressIndicator'

import { IntrospectionQueryConfig } from './config'
import { INTROSPECTION_QUERY } from './query'
import { GraphQLIntrospectionResult } from './types'

const DEFAULT_INTROSPECTION_CONFIG: IntrospectionQueryConfig = {
  includeDeprecated: true,
}

export async function introspect(
  client: GraphQLClient,
  config?: Partial<IntrospectionQueryConfig>
): Promise<GraphQLIntrospectionResult> {
  start('Introspection query')

  const result = await client.request<GraphQLIntrospectionResult>(
    INTROSPECTION_QUERY,
    Object.assign({}, DEFAULT_INTROSPECTION_CONFIG, config)
  )

  if (!result.data || result.errors?.length > 0) {
    failed()

    throw new GraphQLQueryError(
      'expected introspection result to contain data and no errors, but did not',
      result
    )
  }

  succeed()

  return result.data
}
