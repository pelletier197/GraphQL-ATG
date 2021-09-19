import { GeneratorConfig } from '@lib/core/atg/generator/config'
import { GraphQLIntrospectionResultError } from '@lib/core/atg/generator/error'
import { generateGraphQLQueries } from '@lib/core/atg/generator/query/queryGenerator'
import gql, { minify, prettify } from '@lib/core/graphql/gql'
import { GraphQLQuery } from '@lib/core/graphql/query/query'
import { INTROSPECTION_SCHEMA } from '@test/__utils__/farm/server'
import { assert } from 'console'

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

  describe('introspection query max depth configuration is too low', () => {
    it('should generate no queries', () => {
      const result = generateGraphQLQueries(INTROSPECTION_SCHEMA, {
        ...DEFAULT_CONFIG,
        maxDepth: 2,
      })

      expect(result).toHaveLength(0)
    })
  })

  describe('introspection query max depth configuration has an acceptable depth for root fields', () => {
    it('should generate a query that goes up to the max depth', () => {
      const result = generateGraphQLQueries(INTROSPECTION_SCHEMA, {
        ...DEFAULT_CONFIG,
        maxDepth: 4,
      })

      assertGraphQLQueryEqual(result, [
        {
          query: gql`
            query {
              farm {
                vegetables {
                  name
                  isBestVegetableOnEarth
                  cookingModes
                }
              }
            }
          `,
          variables: {},
        },
      ])
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

    expect(generatedQueries).toHaveLength(1)
  })
})

function assertGraphQLQueryEqual(
  actual: ReadonlyArray<GraphQLQuery>,
  expected: ReadonlyArray<GraphQLQuery>
) {
  function transform(
    array: ReadonlyArray<GraphQLQuery>
  ): ReadonlyArray<GraphQLQuery> {
    return array.map(
      (initial: GraphQLQuery): GraphQLQuery => ({
        ...initial,
        query: prettify(minify(initial.query)),
      })
    )
  }

  expect(transform(actual)).toEqual(transform(expected))
}
