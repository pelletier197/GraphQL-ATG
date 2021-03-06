import { introspect } from '@lib/core/atg/introspection/introspecter.js'
import { createClient } from '@lib/infrastructure/graphql/client.js'
import {
  INTROSPECTION_SCHEMA,
  startFarmServer,
} from '@test/__utils__/farm/server.js'
import { lazy } from '@test/__utils__/lazy.js'

const server = lazy(startFarmServer)
const client = lazy(async () => createClient((await server()).url))

afterAll(async () => {
  ;(await server()).manager.stop()
})

describe('running introspection query on a running server', () => {
  describe('and no config is provided', () => {
    it('should include deprecated fields by default', async () => {
      const result = await introspect(await client())
      expect(result).toEqual(INTROSPECTION_SCHEMA)
    })
  })

  describe('and config to ignore deprecated fields is provided', () => {
    it('should include deprecated fields by default', async () => {
      const result = await introspect(await client(), {
        includeDeprecated: false,
      })

      expect(result.__schema.types).toEqual(
        INTROSPECTION_SCHEMA.__schema.types.map((type) => {
          const fields =
            type.fields?.filter((field) => !field.isDeprecated) ?? null

          return {
            ...type,
            fields,
          }
        })
      )
    })
  })
})
