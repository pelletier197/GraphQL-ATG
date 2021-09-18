import gql, { minify, prettify } from '@lib/core/graphql/gql'
import {
  mutationBuilder,
  queryBuilder,
  subSelectionBuilder,
} from '@lib/core/graphql/query/builder'

describe('building a query', () => {
  const underTest = queryBuilder()

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

    describe('adding multiple fields with sub-selection and arguments', () => {
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
        .withField(
          'nestedField',
          [
            {
              name: 'nestedArgument',
              type: 'String',
              value: null,
            },
          ],
          subSelectionBuilder().withField(
            'firstLevel',
            [],
            subSelectionBuilder().withField('secondLevel', [
              {
                name: 'secondLevelArgument',
                type: 'Int!',
                value: 234,
              },
            ])
          )
        )
        .build()

      it('should generate the right request', () => {
        expect(prettify(result.query)).toEqual(
          prettify(gql`
            query (
              $vegetable: VegetableInput
              $name: String!
              $nestedArgument: String
              $secondLevelArgument: Int!
            ) {
              field(vegetable: $vegetable, name: $name)
              nestedField(nestedArgument: $nestedArgument) {
                firstLevel {
                  secondLevel(secondLevelArgument: $secondLevelArgument)
                }
              }
            }
          `)
        )
      })
    })

    describe('sub selection is empty for field', () => {
      const builder = underTest.withField('field', [], subSelectionBuilder())

      it('should generate the right request', () => {
        expect(() => builder.build()).toThrowError()
      })
    })
  })
})

describe('building a mutation', () => {
  const result = mutationBuilder()
    .withField(
      'vegetables',
      [],
      subSelectionBuilder().withField('update', [
        {
          name: 'name',
          type: 'String!',
          value: 'New name',
        },
      ])
    )
    .build()

  it('should generate a mutation query', () => {
    expect(prettify(result.query)).toEqual(
      prettify(gql`
        mutation ($name: String!) {
          vegetables {
            update(name: $name)
          }
        }
      `)
    )
  })
})
