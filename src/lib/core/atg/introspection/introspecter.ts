import { GraphQLClient } from '@lib/core/graphql/client'
import { GraphQLQueryError } from '@lib/core/graphql/error'

import { INTROSPECTION_QUERY, IntrospectionQueryConfig } from './query'
import { GraphQLIntrospectionResult } from './types'

const DEFAULT_INTROSPECTION_CONFIG: IntrospectionQueryConfig = {
  includeDeprecated: true,
}

export async function introspect(
  client: GraphQLClient,
  config?: Partial<IntrospectionQueryConfig>
): Promise<GraphQLIntrospectionResult> {
  const result = await client.request<GraphQLIntrospectionResult>(
    INTROSPECTION_QUERY,
    {
      ...DEFAULT_INTROSPECTION_CONFIG,
      ...config,
    }
  )

  if (!result.data || result.errors?.length > 0) {
    throw new GraphQLQueryError(
      'expected introspection result to contain data and no errors, but did not',
      result
    )
  }

  return result.data
}
