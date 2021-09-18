/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
import _ from 'lodash'
import { GraphQLVariables } from '../client'
import { GraphQLQuery } from './query'

export enum QueryType {
  QUERY = 'query',
  MUTATION = 'mutation',
}

export type Argument = {
  readonly name: string
  readonly type: string
  readonly value: unknown
}

type BuilderFields = Record<
  string,
  {
    readonly args: ReadonlyArray<Argument>
    readonly subSelection?: QueryBuilder
  }
>

type QuerySubSelection = {
  readonly query: string
  readonly variables: ReadonlyArray<Argument>
}

export class QueryBuilder {
  private readonly type: QueryType
  private readonly fields: BuilderFields = {}
  private readonly name: string = ''

  constructor(type: QueryType, fields: BuilderFields) {
    this.type = type
    this.fields = fields
  }

  withField(
    name: string,
    args: ReadonlyArray<Argument>,
    subSelection?: QueryBuilder
  ): QueryBuilder {
    name = name.trim()

    if (name.startsWith('$')) {
      name = name.replace('$', '')
    }

    return new QueryBuilder(this.type, {
      ...this.fields,
      [name]: {
        args,
        subSelection,
      },
    })
  }

  build(): GraphQLQuery {
    if (_.size(this.fields) === 0) {
      throw new Error(
        'Cannot generate a query for no fields. A minimum of one field must be queried'
      )
    }

    const subSelection = this.buildSelection()
    const variablesString = subSelection.variables.map(
      (variable) => `$${variable.name}:${variable.type}`
    )

    const variablePlaceholder =
      variablesString.length === 0 ? '' : `(${variablesString})`

    return {
      query: `${this.type} ${this.name}${variablePlaceholder}${subSelection.query}`,
      variables: _.mapValues(
        _.keyBy(subSelection.variables, (variable: Argument) => variable.name),
        (variable: Argument) => variable.value
      ),
    }
  }

  private buildSelection(): QuerySubSelection {
    return {
      query: '',
      variables: [],
    }
  }
}

export function createQueryBuilder(type: QueryType): QueryBuilder {
  return new QueryBuilder(type, {})
}
