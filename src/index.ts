import { GraphQLFactory } from '@lib/core/atg/generator/config'
import { Headers } from '@lib/infrastructure/graphql/client'
import { InvalidArgumentError, program } from 'commander'
import _ from 'lodash'

function validatedParseInt(value: string): number {
  const parsedValue = parseInt(value, 10)

  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError('Not a number')
  }

  return parsedValue
}

function convertToFactories(
  value: string,
  previous: Record<string, GraphQLFactory>
): Record<string, GraphQLFactory> {
  const error = `
    Invalid factories configuration. Ensure your default export is an object with strings as keys and functions as values.
    Example: 
      export default {
          'Paging': (context) => ({ first: 10, skip: 0 })
      }
  `.trimStart()

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const configuration = require(value)

    if (!(configuration instanceof Object)) {
      throw new InvalidArgumentError(error)
    }

    _.forOwn(configuration, (key: unknown, value: unknown) => {
      if (!(key instanceof String)) {
        throw new InvalidArgumentError(error)
      }

      if (!(value instanceof Function)) {
        throw new InvalidArgumentError(error)
      }
    })

    return {
      ...previous,
      configuration,
    }
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
    throw new InvalidArgumentError(
      'Invalid header value. Value must match the format <header>=<value>'
    )
  }

  return {
    ...previous,
    [result.groups.header]: result.groups.value,
  }
}

program
  .version('1.0.0')
  .requiredOption(
    '-e, --endpoint <endpoint>',
    'The GraphQL endpoint to test against. '
  )
  .option(
    '-h, --header <header>=<value>',
    'Additional headers to add to the GraphQL requests. This can be used for authorization for instance. By doing --header "Authorization=Bearer <token>". This option can be repeated more than once.',
    convertHeader,
    {}
  )
  .option(
    '-iid, --introspection.include-deprecated',
    'Wether or not the introspection should include the deprecated fields or not',
    true
  )
  .option(
    '-gmd, --generation.max-depth <number>',
    'The max depth at which the query generation engine will go to generate queries. Every field over this depth will not be queried, so make sure to put a depth as big as necessary for your entire API can be queried.',
    validatedParseInt,
    3
  )
  .option(
    '--gff, --generation.factories-file',
    'A GraphQL input type factory file configuration. This javascript file will be imported and executed to override the default factories provided by the framework.',
    convertToFactories,
    {}
  )
