import getPackageVersion from '@jsbits/get-package-version'
import { Headers } from '@lib/infrastructure/graphql/client.js'
import { InvalidArgumentError, Option, program } from 'commander'
import _ from 'lodash'

import { GraphQLAtgConfig } from '../atg/config.js'
import {
  GraphQLFactory,
  NullGenerationStrategy,
} from '../atg/generator/config.js'

export async function getAtgConfiguration(): Promise<GraphQLAtgConfig> {
  program
    .version(getPackageVersion())
    .requiredOption(
      '-e, --endpoint <endpoint>',
      'The GraphQL endpoint to test against.'
    )
    .option(
      '-h, --header <header>=<value>',
      'Additional headers to add to the GraphQL requests. This can be used for authorization for instance. By doing --header "Authorization=Bearer <token>". This option can be repeated more than once.',
      convertHeader,
      {}
    )
    .option(
      '-iid, --introspection.include-deprecated',
      'Wether or not the introspection should include the deprecated fields or not.',
      true
    )
    .option(
      '-gmd, --generation.max-depth <number>',
      'The max depth at which the query generation engine will go to generate queries. Every field over this depth will not be queried, so make sure to put a depth as big as necessary for your entire API can be queried.',
      validatedParseInt,
      5
    )
    .option(
      '-gff, --generation.factories-file <file>',
      'A GraphQL input type factory file configuration. This javascript file will be imported and executed to override the default factories provided by the framework.',
      convertToFactoriesFile,
      []
    )
    .addOption(
      new Option(
        '-gns, --generation.null-strategy <strategy>',
        'Allow specifying if the default behaviour for nullable input values when there is no factory provided is to always use null values, sometimes use null values, or never use null values.'
      )
        .choices([
          NullGenerationStrategy.NEVER_NULL,
          NullGenerationStrategy.ALWAYS_NULL,
          NullGenerationStrategy.SOMETIMES_NULL,
        ])
        .default(NullGenerationStrategy.NEVER_NULL)
    )
    .option(
      '-rc, --runner.concurrency',
      'The number of parallel queries to execute.',
      validatedParseInt,
      1
    )
    .option(
      '-rff, --runner.fail-fast',
      'Either the tests should stop after the first error is encountered, or keep running until all queries have been executed.',
      false
    )

  program.parse(process.argv)

  const options = program.opts()

  return {
    endpoint: options['endpoint'],
    headers: options['headers'],
    introspection: {
      includeDeprecated: options['introspection.includeDeprecated'],
    },
    generation: {
      maxDepth: options['generation.maxDepth'],
      nullGenerationStrategy: options['generation.nullStrategy'],
      factories: await parseFactories(options['generation.factoriesFile']),
    },
    runner: {
      concurrency: options['runner.concurrency'],
      failFast: options['runner.failFast'],
    },
  }
}

function validatedParseInt(value: string): number {
  const parsedValue = parseInt(value, 10)

  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError(`Not a number: ${value}`)
  }

  return parsedValue
}

function convertToFactoriesFile(
  value: string,
  previous: ReadonlyArray<string>
): ReadonlyArray<string> {
  return [value, ...previous]
}

async function parseFactories(
  factories: ReadonlyArray<string>
): Promise<Record<string, GraphQLFactory>> {
  return await factories.reduce(
    async (
      previous: Promise<Record<string, GraphQLFactory>>,
      current: string
    ) => {
      const previousValue = await previous
      const result = await parseFactory(current)
      return {
        ...previousValue,
        ...result,
      }
    },
    Promise.resolve({})
  )
}

async function parseFactory(
  value: string
): Promise<Record<string, GraphQLFactory>> {
  const genericError = `
      Invalid factories configuration. Ensure your default export is an object with strings as keys and functions as values.
      Example: 
        export default {
            'Paging': (context) => ({ first: 10, skip: 0 })
        }
    `.trimStart()

  try {
    const configuration = (await import(value)).default

    if (!(configuration instanceof Object)) {
      const specificError = `Expected default export to be of type Object, but was ${configuration} of type ${typeof configuration}`
      throw new InvalidArgumentError(`${specificError}\n\n${genericError}`)
    }

    _.forOwn(configuration, (value: unknown, key: unknown) => {
      if (typeof key !== 'string') {
        const specificError = `Expected default export to contain only keys of type String, but was ${key} of type ${typeof key}`
        throw new InvalidArgumentError(`${specificError}\n\n${genericError}`)
      }

      if (typeof value !== 'function') {
        const specificError = `Expected default export to contain only values of type Function, but was ${value} of type ${typeof value}`
        throw new InvalidArgumentError(`${specificError}\n\n${genericError}`)
      }
    })

    return configuration
  } catch (error) {
    if (error instanceof InvalidArgumentError) {
      throw error
    }

    throw new InvalidArgumentError(
      `Module could not be imported. Make sure it exists and that it is a valid javascript file: ${error}`
    )
  }
}

function convertHeader(value: string, previous: Headers): Headers {
  const regex = /^(?<header>[a-z0-9-]+)=(?<value>.+)$/i
  const result = value.match(regex)
  if (!result?.groups) {
    InvalidArgumentError
    throw new InvalidArgumentError(
      'Invalid header value. Value must match the format <header>=<value>'
    )
  }

  return {
    ...previous,
    [result.groups.header]: result.groups.value,
  }
}
