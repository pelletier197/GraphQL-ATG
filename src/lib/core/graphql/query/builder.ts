/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
import _ from 'lodash'

import { GraphQLQuery } from './query'

export enum QueryType {
  QUERY = 'query',
  MUTATION = 'mutation',
}

export type Parameter = {
  readonly name: string
  readonly type: string
  readonly value: unknown
}

type BuilderField = {
  readonly parameters: ReadonlyArray<Parameter>
  readonly subSelection?: QueryBuilder
}

type BuilderFields = Record<string, BuilderField>

type QuerySubSelection = {
  readonly query: string
  readonly variables: ReadonlyArray<Parameter>
}

export class QueryBuilder {
  private readonly type: QueryType
  private readonly fields: BuilderFields = {}
  private readonly name: string = ''

  constructor(type: QueryType, fields: BuilderFields) {
    this.type = type
    this.fields = fields
  }

  withType(type: QueryType): QueryBuilder {
    return new QueryBuilder(type, this.fields)
  }

  withField(
    name: string,
    parameters: ReadonlyArray<Parameter>,
    subSelection?: QueryBuilder
  ): QueryBuilder {
    name = name.trim()

    return new QueryBuilder(this.type, {
      ...this.fields,
      [name]: {
        parameters,
        subSelection,
      },
    })
  }

  build(): GraphQLQuery {
    const subSelection = this.buildSelection()
    const variablePlaceholder = this.generateArgumentPlaceholder(
      subSelection.variables
    )

    return {
      query: `${this.type} ${this.name}${variablePlaceholder}${subSelection.query}`,
      variables: _.mapValues(
        _.keyBy(subSelection.variables, (variable: Parameter) => variable.name),
        (variable: Parameter) => variable.value
      ),
    }
  }

  private buildSelection(): QuerySubSelection {
    if (!this.hasFields()) {
      throw new Error(
        'Cannot generate a sub-selection with no fields in it. A minimum of one field must be queried if the sub-selection is defined.'
      )
    }

    type BuiltSubSelection = {
      readonly parameters: ReadonlyArray<Parameter>
      readonly subSelection?: QuerySubSelection
    }

    const mappedFields: Record<string, BuiltSubSelection> = _.mapValues(
      this.fields,
      (field: BuilderField) => ({
        parameters: field.parameters,
        subSelection: field.subSelection?.buildSelection(),
      })
    )

    const fieldsAsQueries: ReadonlyArray<string> = Object.keys(
      mappedFields
    ).map((name: string) => {
      const value = mappedFields[name]

      // TODO parameter variable name should not be the same as the variable. We might try to use the same parameter for two things
      const parametersString = value.parameters
        .map((parameter: Parameter) => `${parameter.name}: $${parameter.name}`)
        .join(', ')

      const parameterPlaceholder =
        parametersString.length === 0 ? '' : `(${parametersString})`

      return `${name}${parameterPlaceholder}${value.subSelection?.query ?? ''}`
    })

    const allQueryVariablesRequiredNested: ReadonlyArray<Parameter> = _.flatMap(
      Object.keys(mappedFields).map((name: string) => {
        const mappedField = mappedFields[name]
        return [
          ...mappedField.parameters, // Current field parameters
          ...(mappedField.subSelection?.variables || []), // Parameters of sub selection
        ]
      })
    )

    return {
      query: `
        {
          ${fieldsAsQueries.join('\n')}
        }
      `,
      variables: allQueryVariablesRequiredNested,
    }
  }

  private generateArgumentPlaceholder(
    variables: ReadonlyArray<Parameter>
  ): string {
    const variablesString = variables
      .map((variable) => `$${variable.name}:${variable.type}`)
      .join(', ')

    return variablesString.length === 0 ? '' : `(${variablesString})`
  }

  private hasFields(): boolean {
    return _.size(this.fields) !== 0
  }
}

export function queryBuilder(): QueryBuilder {
  return new QueryBuilder(QueryType.QUERY, {})
}

export function mutationBuilder(): QueryBuilder {
  return new QueryBuilder(QueryType.MUTATION, {})
}

export function subSelectionBuilder(): QueryBuilder {
  return queryBuilder()
}
