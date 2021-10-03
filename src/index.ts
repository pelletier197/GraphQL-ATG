import { runGraphQLAtg } from '@lib/core/atg/graphqlAtg'
import { getAtgConfiguration } from '@lib/core/cli/cli'

async function run() {
  const config = await getAtgConfiguration()
  await runGraphQLAtg(config)
}

run()
