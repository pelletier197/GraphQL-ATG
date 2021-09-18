import gql, { prettify } from '@lib/core/graphql/gql'
import { createQueryBuilder, QueryType } from '@lib/core/graphql/query/builder'

describe('building a query', () => {
  const underTest = createQueryBuilder(QueryType.QUERY)

  describe('generating the query with no fields', () => {
    it('should raise an error', () => {
      expect(() => underTest.build()).toThrowError()
    })
  })

  describe('adding fields to builder', () => {
    it('should not modify the original object', () => {
      expect(underTest.withField('name', [])).not.toBe(underTest)
    })

    describe('field has no arguments and not sub-selection', () => {
      const result = underTest.withField('field', []).build()

      it('should generate the right request', () => {
        expect(prettify(result.query)).toEqual(
          prettify(
            gql`
              {
                query {
                  field
                }
              }
            `
          )
        )
      })
    })
  })
})
