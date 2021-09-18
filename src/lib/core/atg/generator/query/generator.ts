import _ from 'lodash'

import { FullType, GraphQLIntrospectionResult } from '../../introspection/types'
import { GraphQLGenerationError } from '../error'
import { GeneratedGraphQLQuery } from '../generatedQuery'

export function generateGraphQLQueries(
  introspectionResult: GraphQLIntrospectionResult
): ReadonlyArray<GeneratedGraphQLQuery> {
  const schema = introspectionResult.__schema

  // There is no query type, so no queries can be generated
  if (!schema.queryType) return []

  const typesByName: Record<string, FullType> = _.keyBy(
    schema.types,
    (type) => type.name
  )

  const rootQueryType = getRootQueryType(schema.queryType.name, typesByName)

  return []
}

function getRootQueryType(
  rootQueryTypeName: string,
  typesByName: Record<string, FullType>
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
