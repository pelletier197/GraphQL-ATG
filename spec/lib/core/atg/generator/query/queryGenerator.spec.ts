import { GeneratorConfig } from '@lib/core/atg/generator/config'
import { GraphQLIntrospectionResultError } from '@lib/core/atg/generator/error'
import { generateGraphQLQueries } from '@lib/core/atg/generator/query/queryGenerator'
import { prettify } from '@lib/core/graphql/gql'
import { INTROSPECTION_SCHEMA } from '@test/__utils__/farm/server'

const DEFAULT_CONFIG: GeneratorConfig = {
  factories: {},
  maxDepth: 10,
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

  describe('introspection query has a root query type, but the root type does not exist in the types list', () => {
    it('should generate no queries', () => {
      expect(() =>
        generateGraphQLQueries(
          {
            __schema: {
              queryType: { name: 'Query' },
              directives: [],
              types: [],
            },
          },
          DEFAULT_CONFIG
        )
      ).toThrowError(GraphQLIntrospectionResultError)
    })
  })

  it('should run', () => {
    const generatedQueries = generateGraphQLQueries(
      INTROSPECTION_SCHEMA,
      DEFAULT_CONFIG
    )

    console.log(prettify(generatedQueries[0].query))
    expect(generatedQueries).toHaveLength(1)
  })
})
