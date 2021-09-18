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

    describe('field has no arguments and no sub-selection', () => {
      const result = underTest.withField('field', []).build()

      it('should generate the right request', () => {
        expect(prettify(result.query)).toEqual(
          prettify(
            gql`
              query {
                field
              }
            `
          )
        )
      })
    })

    describe('field has arguments and no sub-selection', () => {
      const result = underTest
        .withField('field', [
          {
            name: 'vegetable',
            type: 'VegetableInput',
            value: {
              name: 'Potato',
              bestVegetableInTheWorld: true,
            },
          },
          {
            name: 'name',
            type: 'String!',
            value: 'Raw veggies',
          },
        ])
        .build()

      it('should generate the right request', () => {
        expect(prettify(result.query)).toEqual(
          prettify(
            gql`
              query ($vegetable: VegetableInput, $name: String!) {
                field(vegetable: $vegetable, name: $name)
              }
            `
          )
        )
      })
    })
  })
})
