#!/usr/bin/env node

import { runGraphQLAtg } from '@lib/core/atg/graphqlAtg.js'
import { getAtgConfiguration } from '@lib/core/cli/cli.js'

async function run() {
  const config = await getAtgConfiguration()
  const results = await runGraphQLAtg(config)
  process.exit(results.failed)
}

run()
