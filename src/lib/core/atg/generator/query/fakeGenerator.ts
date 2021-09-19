import { Parameter } from '@lib/core/graphql/query/builder'
import _ from 'lodash'

import {
  Field,
  FullType,
  InputValue,
  Kind,
  TypeRef,
} from '../../introspection/types'
import { GeneratorConfig, GraphQLFactory } from '../config'
import { GraphQLGenerationError } from '../error'
import { DEFAULT_FACTORIES } from './defaultFactories'

import {
  createIntrospectionError,
  isList,
  typeToString,
  unwrapType,
} from './extractor'
import { TypesByName } from './types'

export function generateArgsForField(
  field: Field,
  typesByName: TypesByName,
  config: GeneratorConfig
): ReadonlyArray<Parameter> {
  return field.args.map((argument) =>
    generateArgument(argument, typesByName, config)
  )
}

function generateArgument(
  argument: InputValue,
  typesByName: TypesByName,
  config: GeneratorConfig
): Parameter {
  return {
    name: argument.name,
    type: typeToString(argument.type),
    value: generateRandomFromType(
      argument.type,
      argument.name,
      typesByName,
      config
    ),
  }
}

function generateRandomFromType(
  argumentType: TypeRef,
  targetName: string,
  typesByName: TypesByName,
  config: GeneratorConfig
): unknown {
  const context = {
    targetName,
  }

  const defaultFactory = argumentType.name
    ? DEFAULT_FACTORIES[argumentType.name]
    : undefined

  return findMostSpecificFactory(
    argumentType,
    typesByName,
    config
  )({
    ...context,
    default: defaultFactory
      ? {
          provide: () => defaultFactory(context),
        }
      : undefined,
  })
}

function findMostSpecificFactory(
  argumentType: TypeRef,
  typesByName: TypesByName,
  config: GeneratorConfig
): GraphQLFactory {
  const unwrappedArgumentType = unwrapType(argumentType, typesByName)
  const isArgumentAList = isList(argumentType)

  if (isArgumentAList) {
    // Is there a factory for this specific list types
    const factory = config.factories[`[${unwrappedArgumentType.name}]`]
    if (factory !== undefined) {
      return factory
    }
  }

  // Get the factory for this type or the random one
  const factory =
    config.factories[unwrappedArgumentType.name] ??
    randomFactory(unwrappedArgumentType, typesByName, config)

  if (isArgumentAList) {
    return (context) => [factory(context)]
  }

  return factory
}

function randomFactory(
  argumentType: FullType,
  typesByName: TypesByName,
  config: GeneratorConfig
): GraphQLFactory {
  if (argumentType.kind === Kind.ENUM) {
    if (!argumentType.enumValues) {
      throw createIntrospectionError(`
        Argument of kind '${argumentType.kind}' has field 'enumValues' set to '${argumentType.enumValues}'
      `)
    }

    return () => _.sample(argumentType.enumValues)?.name
  }

  if (argumentType.kind === Kind.SCALAR) {
    throw new GraphQLGenerationError(`
      Cannot generate a random value for scalar '${argumentType.name}'. 
      The random generator is not able to randomly generate a value for non-standard GraphQL scalars. 
      You have to provide a custom factory by providing this in your config:
      {
        '${argumentType.name}': () => generateRandomCustomScalar()
      }
    `)
  }

  if (argumentType.kind === Kind.OBJECT) {
    const fields = argumentType.fields || []

    // Generates a random object the required fields in the object
    return () => {
      return _.mapValues(
        _.keyBy(fields, (field) => field.name),
        (field: Field) => {
          return generateRandomFromType(
            field.type,
            field.name,
            typesByName,
            config
          )
        }
      )
    }
  }

  throw new Error('this should be unreachable')
}
