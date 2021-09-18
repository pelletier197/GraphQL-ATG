import { createClient } from '@lib/infrastructure/graphql/client'

import { GraphQLAtgConfig } from './config'

export type GraphQLAtg = {
  readonly run: () => Promise<void>
}

export function createGraphQLAtg(config: GraphQLAtgConfig): GraphQLAtg {
  const client = createClient(config.endpoint, config.headers)

  return {
    run: async () => {
      console.log('fsdf')
    },
  }
}
