import _ from 'lodash'

import {
  Field,
  FullType,
  GraphQLIntrospectionResult,
} from '../../introspection/types'
import { GeneratorConfig } from '../config'
import { GraphQLGenerationError } from '../error'
import { GeneratedGraphQLQuery } from '../../../graphql/query/query'

type TypesByName = Record<string, FullType>

export function generateGraphQLQueries(
  introspectionResult: GraphQLIntrospectionResult,
  config: GeneratorConfig
): ReadonlyArray<GeneratedGraphQLQuery> {
  const schema = introspectionResult.__schema

  // There is no query type, so no queries can be generated
  if (!schema.queryType) return []

  const typesByName: TypesByName = _.keyBy(schema.types, (type) => type.name)

  const rootQueryType = getType(schema.queryType.name, typesByName)
  if (!rootQueryType.fields) return []

  return rootQueryType.fields.map((field) => generateQuery(field, typesByName))
}

function generateQuery(
  rootField: Field,
  typesByName: TypesByName
): GeneratedGraphQLQuery {
  const query = ['query', '{']
  return {
    query: '',
    variables: {},
  }
}

function getType(
  typeName: string,
  typesByName: TypesByName,
  source?: string
): FullType {
  const rootQueryType = typesByName[typeName]

  if (rootQueryType == null) {
    throw new GraphQLGenerationError(`
      Type '${typeName}'${
      source ? ` specified as a field of '${source}'` : ''
    } is not present in the list of types returned by the introspection query.

      This is not supposed to happen in any valid GraphQL server implementation...
    `)
  }

  return rootQueryType
}
