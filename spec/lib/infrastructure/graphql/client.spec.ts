import gql from '@lib/core/graphql/gql.js'
import { createClient } from '@lib/infrastructure/graphql/client.js'
import {
  EXPECTED_ALL_ANIMALS_QUERY_RESULT,
  QUERY_ALL_ANIMALS,
  startFarmServer,
} from '@test/__utils__/farm/server.js'
import { lazy } from '@test/__utils__/lazy.js'

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

  describe('the request contains errors', () => {
    it('should contain errors', async () => {
      const result = await (
        await client()
      ).request(gql`
        {
          farm {
            animals {
              names
            }
          }
        }
      `)

      expect(result.errors).toHaveLength(1)
      expect(result.errors.map((error) => error.message)).toEqual([
        `Cannot query field "names" on type "Animals".`,
      ])
      expect(result.errors[0].locations).toBeTruthy()
    })
  })
})
