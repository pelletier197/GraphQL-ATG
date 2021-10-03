import { runGraphQLAtg } from '@lib/core/atg/graphqlAtg'
import { getAtgConfiguration } from '@lib/core/cli/cli'
import { failed } from '@lib/core/progress/progressIndicator'

async function run() {
  const config = await getAtgConfiguration()

  try {
    await runGraphQLAtg(config)
  } catch (error) {
    failed()

    throw error
  }
}

run()
