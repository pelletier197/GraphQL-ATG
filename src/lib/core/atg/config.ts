import { Headers } from '@lib/infrastructure/graphql/client'

import { IntrospectionQueryConfig } from './introspection/query'

export type GraphQLAtgConfig = {
  readonly endpoint: string
  readonly headers?: Headers
  readonly introspection?: IntrospectionQueryConfig
}
