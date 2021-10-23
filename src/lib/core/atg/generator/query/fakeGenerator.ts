import { Parameter } from '@lib/core/graphql/query/builder.js'
import _ from 'lodash'
import micromatch from 'micromatch'

import {
  Field,
  FullType,
  InputValue,
  Kind,
  TypeRef,
} from '../../introspection/types.js'
import {
  GeneratorConfig,
  GraphQLFactory,
  NullGenerationStrategy,
} from '../config.js'
import { GraphQLGenerationError } from '../error.js'

import { DEFAULT_FACTORIES } from './defaultFactories.js'
import {
  createIntrospectionError,
  isList,
  isNonNull,
  typeToString,
  unwrapList,
  unwrapNonNull,
  unwrapType,
} from './extractor.js'
import { TypesByName } from './types.js'

export function generateArgsForField(
  field: Field,
  typesByName: TypesByName,
  config: GeneratorConfig
): ReadonlyArray<Parameter> {
  return field.args.map((argument) =>
    generateInputParameter(argument, typesByName, config)
  )
}

function generateInputParameter(
  input: InputValue,
  typesByName: TypesByName,
  config: GeneratorConfig
): Parameter {
  return {
    name: input.name,
    type: typeToString(input.type),
    value: generateInput(input, typesByName, config),
  }
}

function generateInput(
  input: InputValue,
  typesByName: TypesByName,
  config: GeneratorConfig
): unknown {
  // If you have a field [String!]!, this returns the factory for the string.
  const unwrappedType = unwrapType(input.type, typesByName)
  const defaultFactory = unwrappedType.name
    ? DEFAULT_FACTORIES[unwrappedType.name]
    : undefined

  const context = {
    targetName: input.name,
    defaultValue: input.defaultValue,
  }

  return findMostSpecificFactory(
    input.type,
    typesByName,
    config
  )({
    ...context,
    defaultFactory: defaultFactory
      ? {
          provide: () => defaultFactory(context),
        }
      : undefined,
    randomFactory: {
      provide: () => {
        return randomFactory(unwrappedType, typesByName, config)(context)
      },
    },
  })
}

function findMostSpecificFactory(
  argumentType: TypeRef,
  typesByName: TypesByName,
  config: GeneratorConfig,
  nullable = true
): GraphQLFactory {
  // Did the user provide a factory for this exact type?
  const factoryDirectType = config.factories[typeToString(argumentType)]
  if (factoryDirectType) {
    return factoryDirectType
  }

  // If not null, we must unwrap and go deeper
  if (isNonNull(argumentType)) {
    return findMostSpecificFactory(
      unwrapNonNull(argumentType),
      typesByName,
      config,
      false
    )
  }

  // The wrapped type allowed for nullable
  if (
    nullable &&
    (config.nullGenerationStrategy == NullGenerationStrategy.ALWAYS_NULL ||
      (config.nullGenerationStrategy == NullGenerationStrategy.SOMETIMES_NULL &&
        Math.random() > 0.5))
  ) {
    return () => null
  }

  // For a list, we find a factory for its elements
  if (isList(argumentType)) {
    const listElementFactory = findMostSpecificFactory(
      unwrapList(argumentType),
      typesByName,
      config
    )
    return (context) => [listElementFactory(context)]
  }

  const unwrappedArgumentType = unwrapType(argumentType, typesByName)

  // Factory that matches by wildcard
  const wildCardFactory = findWildCardFactory(
    unwrappedArgumentType.name,
    config
  )
  if (wildCardFactory) {
    return wildCardFactory
  }

  // Factory that matches by wildcard
  return randomFactory(unwrappedArgumentType, typesByName, config)
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
    const fields = argumentType.inputFields || []

    // Generates a random object the required fields in the object
    return () => {
      return _.mapValues(
        _.keyBy(fields, (field) => field.name),
        (input: InputValue) => {
          return generateInput(input, typesByName, config)
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
