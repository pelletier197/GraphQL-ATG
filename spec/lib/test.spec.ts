import { testFunction } from '@lib/test'
import test from 'ava'

test('getABC', (t) => {
  t.is(testFunction(), 4)
})
