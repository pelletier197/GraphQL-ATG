import _ from 'lodash'

import {
  Field,
  FullType,
  GraphQLIntrospectionResult,
} from '../../introspection/types'
import { GraphQLGenerationError } from '../error'
import { GeneratedGraphQLQuery } from '../generatedQuery'

type TypesByName = Record<string, FullType>

export function generateGraphQLQueries(
  introspectionResult: GraphQLIntrospectionResult
): ReadonlyArray<GeneratedGraphQLQuery> {
  const schema = introspectionResult.__schema

  // There is no query type, so no queries can be generated
  if (!schema.queryType) return []

  const typesByName: TypesByName = _.keyBy(schema.types, (type) => type.name)

  const rootQueryType = getRootQueryType(schema.queryType.name, typesByName)

  if (!rootQueryType.fields) return []

  return rootQueryType.fields.map((field) => generateQuery(field, typesByName))
}

function generateQuery(
  rootField: Field,
  typesByName: TypesByName
): GeneratedGraphQLQuery {
  return {
    query: '',
    variables: {},
  }
}

function getRootQueryType(
  rootQueryTypeName: string,
  typesByName: TypesByName
): FullType {
  const rootQueryType = typesByName[rootQueryTypeName]

  if (rootQueryType == null) {
    throw new GraphQLGenerationError(`
      Root query type '${rootQueryTypeName}' is not present in the list of types returned by the introspection query.

      This is not supposed to happen in any valid GraphQL server implementation...
    `)
  }

  return rootQueryType
}
