import { GraphQLClient } from '@lib/core/graphql/client'
import { INTROSPECTION_QUERY } from './query'
import { GraphQLIntrospectionResult } from './types'

export type IntrospectionConfig = {
  readonly includeDeprecated?: boolean
}

export async function introspect(
  client: GraphQLClient,
  config?: IntrospectionConfig
): Promise<GraphQLIntrospectionResult> {
  const result = await client.request<GraphQLIntrospectionResult>(
    INTROSPECTION_QUERY,
    {
      includeDeprecated:
        config?.includeDeprecated === undefined
          ? true
          : config.includeDeprecated,
    }
  )

  if (!result.data) {
    throw Error('expected introspection result to contain data, but did not')
  }
  
  return result.data
}
