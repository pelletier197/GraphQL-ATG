import { Parameter } from '@lib/core/graphql/query/builder'
import _ from 'lodash'
import micromatch from 'micromatch'

import {
  Field,
  FullType,
  InputValue,
  Kind,
  TypeRef,
} from '../../introspection/types'
import {
  GeneratorConfig,
  GraphQLFactory,
  NullGenerationStrategy,
} from '../config'
import { GraphQLGenerationError } from '../error'

import { DEFAULT_FACTORIES } from './defaultFactories'
import {
  createIntrospectionError,
  isList,
  isNonNull,
  typeToString,
  unwrapNonNull,
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

  const nullable = !isNonNull(argumentType)
  if (nullable) {
    // And that null generation is either always null, or that we randomly decide to return null
    if (
      config.nullGenerationStrategy == NullGenerationStrategy.ALWAYS_NULL ||
      (config.nullGenerationStrategy == NullGenerationStrategy.SOMETIMES_NULL &&
        Math.random() > 0.5)
    ) {
      return null
    }
  }

  const unwrapedArgument = unwrapNonNull(argumentType)

  const defaultFactory = unwrapedArgument.name
    ? DEFAULT_FACTORIES[unwrapedArgument.name]
    : undefined

  return findMostSpecificFactory(
    unwrapedArgument,
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

  // Get the specific factory for this type or one by wildcard or a random one
  const factory =
    config.factories[unwrappedArgumentType.name] ??
    findWildCardFactory(unwrappedArgumentType.name, config) ??
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
    const defaultFactory = DEFAULT_FACTORIES[argumentType.name]
    if (defaultFactory === undefined) {
      throw new GraphQLGenerationError(`
        Cannot generate a random value for scalar '${argumentType.name}'. 
        The random generator is not able to randomly generate a value for non-standard GraphQL scalars. 
        You have to provide a custom factory by providing this in your config:
        {
          '${argumentType.name}': () => generateRandomCustomScalar()
        }
    `)
    }

    return defaultFactory
  }

  if (argumentType.kind === Kind.INPUT_OBJECT) {
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
function findWildCardFactory(
  name: string,
  config: GeneratorConfig
): GraphQLFactory | undefined {
  const matchingKey = Object.keys(config.factories).find((key) =>
    micromatch.isMatch(name, key)
  )

  if (matchingKey) {
    return config.factories[matchingKey]
  }

  return undefined
}
