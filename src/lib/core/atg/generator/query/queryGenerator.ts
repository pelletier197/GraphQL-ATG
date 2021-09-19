import {
  Parameter,
  QueryBuilder,
  queryBuilder,
  subSelectionBuilder,
} from '@lib/core/graphql/query/builder'
import { isLeafType } from 'graphql'
import _ from 'lodash'

import { GraphQLQuery } from '../../../graphql/query/query'
import {
  Field,
  FullType,
  GraphQLIntrospectionResult,
} from '../../introspection/types'
import { GeneratorConfig } from '../config'

import { getRequiredType, isLeaf, unwrapFieldType } from './extractor'
import { TypesByName } from './types'

export function generateGraphQLQueries(
  introspectionResult: GraphQLIntrospectionResult,
  config: GeneratorConfig
): ReadonlyArray<GraphQLQuery> {
  const schema = introspectionResult.__schema

  // There is no query type, so no queries can be generated
  if (!schema.queryType) return []

  const typesByName: TypesByName = _.keyBy(schema.types, (type) => type.name)

  const rootQueryType = getRequiredType(schema.queryType.name, typesByName)
  if (!rootQueryType.fields) return []

  const initialBuilder = queryBuilder()

  return rootQueryType.fields
    .map((field) => {
      return buildField(initialBuilder, field, typesByName, config, 1)
    })
    .filter((x) => x !== initialBuilder)
    .map((x) => x.build())
}

function generateField(
  type: FullType,
  typesByName: TypesByName,
  config: GeneratorConfig,
  depth: number
): QueryBuilder | null {
  // Go no further
  if (depth >= config.maxDepth) {
    return null
  }

  if (isLeaf(type)) {
    // No more fields under
    return null
  }

  const builder = subSelectionBuilder()

  const fields = type.fields || []
  const finalBuilderWithAllFields = _.reduce(
    fields,
    (memo: QueryBuilder, field: Field) => {
      return buildField(memo, field, typesByName, config, depth)
    },
    builder
  )

  if (finalBuilderWithAllFields === builder) {
    // No change in the builder indicates that there were no leaf elements
    // and that no sub fields could be selected due to max depth being reached
    return null
  }

  return finalBuilderWithAllFields
}

function buildField(
  memo: QueryBuilder,
  field: Field,
  typesByName: TypesByName,
  config: GeneratorConfig,
  depth: number
): QueryBuilder {
  // TODO - fill the args
  const parameters: ReadonlyArray<Parameter> = []

  const type = unwrapFieldType(field, typesByName)
  const isLeafField = isLeaf(type)

  if (isLeafField) {
    // No sub selection is allowed since this is a leaf
    return memo.withField(field.name, parameters)
  }

  const generatedSubSelection = generateField(
    type,
    typesByName,
    config,
    depth + 1
  )

  if (generatedSubSelection === null) {
    // No new field in the builder, as we can't select any sub field due to max depth
    return memo
  }

  // Modify the builder to select the sub field
  return memo.withField(field.name, parameters, generatedSubSelection)
}
