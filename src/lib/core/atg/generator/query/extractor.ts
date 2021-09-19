import { Field, FullType, Kind, TypeRef } from '../../introspection/types'
import { GraphQLIntrospectionResultError } from '../error'

import { TypesByName } from './types'

export function unwrapFieldType(
  field: Field,
  typesByName: TypesByName
): FullType {
  return unwrapType(field.type, typesByName, field.name)
}

export function unwrapType(
  type: TypeRef,
  typesByName: TypesByName,
  source?: string
): FullType {
  if (!type.ofType) {
    const supportedLeaves = [
      Kind.INTERFACE,
      Kind.OBJECT,
      Kind.SCALAR,
      Kind.ENUM,
    ]

    if (!supportedLeaves.includes(type.kind)) {
      throw createIntrospectionError(`
            Leaf element ${specifiedBySource(source)} has invalid kind ${
        type.kind
      } 
            Supported types for leaf elements include ${supportedLeaves}
        `)
    }

    if (!type.name) {
      throw createIntrospectionError(`
        Leaf element ${specifiedBySource(
          source
        )} has 'name' property set to null
      `)
    }

    return getRequiredType(type.name, typesByName, source)
  }

  return unwrapType(type.ofType, typesByName, source)
}

export function getRequiredType(
  typeName: string,
  typesByName: TypesByName,
  source?: string
): FullType {
  const rootQueryType = typesByName[typeName]

  if (rootQueryType == null) {
    throw createIntrospectionError(
      `Type '${typeName}'${specifiedBySource(
        source
      )} is not present in the list of types returned by the introspection query.`
    )
  }

  return rootQueryType
}

function specifiedBySource(source?: string): string {
  return source ? ` specified by '${source}'` : ''
}

function createIntrospectionError(
  message: string
): GraphQLIntrospectionResultError {
  return new GraphQLIntrospectionResultError(
    `
        ${message}
        ${thisIsNotSupposedToHappen()}
      `.trimStart()
  )
}
function thisIsNotSupposedToHappen(): string {
  return `
        This is not supposed to happen in any valid GraphQL server implementation...
    `
}

export function isLeaf(type: FullType): boolean {
  return !type.fields || type.fields.length === 0
}
