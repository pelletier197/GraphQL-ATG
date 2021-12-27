import getPackageVersion from '@jsbits/get-package-version'
import { Headers } from '@lib/infrastructure/graphql/client.js'
import { InvalidArgumentError, Option, program } from 'commander'

import { GraphQLAtgConfig } from '../atg/config.js'
import { NullGenerationStrategy } from '../atg/generator/config.js'

import { parseModules } from './module.js'

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
      '-m, --module <file>',
      'A Javascript input type module file. This javascript file will be imported and executed to replace default behaviors and customize your test executions.',
      convertToFactoriesFile,
      []
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
      '-rc, --runner.concurrency <count>',
      'The number of parallel queries to execute.',
      validatedParseInt,
      1
    )
    .option(
      '-rff, --runner.fail-fast',
      'Either the tests should stop after the first error is encountered, or keep running until all queries have been executed.',
      false
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

  program.parse(process.argv)

  const options = program.opts()

  const modules = await parseModules(options['module'])

  return {
    endpoint: options['endpoint'],
    headers: options['header'],
    introspection: {
      includeDeprecated: options['introspection.includeDeprecated'],
    },
    generation: {
      maxDepth: options['generation.maxDepth'],
      nullGenerationStrategy: options['generation.nullStrategy'],
      factories: modules.factories,
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
