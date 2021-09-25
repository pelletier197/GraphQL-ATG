import { createGraphQLAtg } from '@lib/core/atg/graphqlAtg.js'
import { failed, start, succeed } from '@lib/core/progress/progressIndicator.js'

const t = createGraphQLAtg({
  endpoint: 'http://localhost:8088',
})

console.log(t)

start('step 1')
succeed()
start('step 2')
failed()
start('step 3')
succeed()
