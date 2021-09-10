import test from 'ava'

import { testFunction } from '../../src/lib/test'

test('getABC', (t) => {
  t.is(testFunction(), 4)
})
