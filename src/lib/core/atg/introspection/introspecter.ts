import { GraphQLClient, GraphQLResponse } from '@lib/core/graphql/client'
import { GraphQLQueryError } from '@lib/core/graphql/error'
import { newTask } from '@lib/core/progress/progressIndicator'

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
  const task = newTask<GraphQLResponse<GraphQLIntrospectionResult>>(
    async () => {
      const result = await client.request<GraphQLIntrospectionResult>(
        INTROSPECTION_QUERY,
        Object.assign({}, DEFAULT_INTROSPECTION_CONFIG, config)
      )

      if (!result.data || result.errors?.length > 0) {
        throw new GraphQLQueryError(
          'expected introspection result to contain data and no errors, but did not',
          result
        )
      }

      return result
    },
    {
      name: 'Introspection query',
      exitOnError: true,
    }
  )

  const result = await task.start()

  if (result.data) {
    return result.data
  }

  throw Error('this code should be unreachable code')
}
