import { failed, start, succeed } from '@lib/core/progress/progressIndicator'

console.log('test')

start('step 1')
succeed()
start('step 2')
failed()
start('step 3')
succeed()
