#!/usr/bin/env node

import { runGraphQLAtg } from '@lib/core/atg/graphqlAtg.js'
import { getAtgConfiguration } from '@lib/core/cli/cli.js'
import { InvalidArgumentError } from 'commander'

async function run() {
  try {
    const config = await getAtgConfiguration()
    const results = await runGraphQLAtg(config)
    process.exit(results.failed)
  } catch (error) {
    if (error instanceof Error) {
      if (error instanceof InvalidArgumentError) {
        console.log(error.message)
        process.exit(error.exitCode)
      }

      console.log(error.message)
      process.exit(1)
    }

    throw error
  }
}

run()
