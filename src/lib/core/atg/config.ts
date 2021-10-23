import { Headers } from '@lib/infrastructure/graphql/client.js'

import { GeneratorConfig } from './generator/config.js'
import { IntrospectionQueryConfig } from './introspection/config.js'
import { RunnerConfig } from './runner/config.js'

export type GraphQLAtgConfig = {
  readonly endpoint: string
  readonly headers?: Headers
  readonly introspection?: Partial<IntrospectionQueryConfig>
  readonly generation?: Partial<GeneratorConfig>
  readonly runner?: Partial<RunnerConfig>
}
