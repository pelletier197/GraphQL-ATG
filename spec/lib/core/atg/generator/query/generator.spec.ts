import { GeneratorConfig } from '@lib/core/atg/generator/config'
import { generateGraphQLQueries } from '@lib/core/atg/generator/query/generator'
import { INTROSPECTION_SCHEMA } from '@test/__utils__/farm/server'

const DEFAULT_CONFIG: GeneratorConfig = {
  factories: {},
  maxDepth: 3,
}

describe('generating graphql queries', () => {
  describe('introspection query has no root query type', () => {
    it('should generate no queries', () => {
      const result = generateGraphQLQueries(
        {
          __schema: {
            directives: [],
            types: [],
          },
        },
        DEFAULT_CONFIG
      )

      expect(result).toHaveLength(0)
    })
  })

  it('should run', () => {
    const generatedQueries = generateGraphQLQueries(
      INTROSPECTION_SCHEMA,
      DEFAULT_CONFIG
    )

    expect(generatedQueries).toHaveLength(1)
  })
})
