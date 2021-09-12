import { GraphQLClient } from '@lib/core/graphql/client'
import { createClient } from '@lib/infrastructure/graphql/client'

import {
  EXPECTED_ALL_ANIMALS_QUERY_RESULT,
  QUERY_ALL_ANIMALS,
  startFarmServer,
} from '../__utils__/farmServer'
import { lazy } from '../__utils__/lazy'

const server = lazy(startFarmServer)
const client = lazy(async () => createClient((await server()).url))

afterAll(async () => {
  ;(await server()).manager.stop()
})

describe('running a request to the server', () => {
  describe('the request has no errors', () => {
    it('should have no errors', async () => {
      const result = await (await client()).request(QUERY_ALL_ANIMALS)
      expect(result.errors).toEqual([])
    })

    it('should contain all the animals of the farm', async () => {
      const result = await (await client()).request(QUERY_ALL_ANIMALS)
      expect(result.data).toEqual(EXPECTED_ALL_ANIMALS_QUERY_RESULT)
    })
  })
})
