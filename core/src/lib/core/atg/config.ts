import { Headers } from '@lib/infrastructure/graphql/client'

import { GeneratorConfig } from './generator/config'
import { IntrospectionQueryConfig } from './introspection/config'

export type GraphQLAtgConfig = {
  readonly endpoint: string
  readonly headers?: Headers
  readonly introspection?: Partial<IntrospectionQueryConfig>
  readonly generation?: Partial<GeneratorConfig>
}
