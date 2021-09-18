import { introspect } from '@lib/core/atg/introspection/introspecter'
import { GraphQLIntrospectionResult } from '@lib/core/atg/introspection/types'
import { createClient } from '@lib/infrastructure/graphql/client'
import { startFarmServer } from '@test/__utils__/farmServer'
import { lazy } from '@test/__utils__/lazy'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fullSchema: GraphQLIntrospectionResult = require('./schema.json')

const server = lazy(startFarmServer)
const client = lazy(async () => createClient((await server()).url))

afterAll(async () => {
  ;(await server()).manager.stop()
})

describe('running introspection query on a running server', () => {
  describe('and no config is provided', () => {
    it('should include deprecated fields by default', async () => {
      const result = await introspect(await client())
      expect(result).toEqual(fullSchema)
    })
  })

  describe('and config to ignore deprecated fields is provided', () => {
    it('should include deprecated fields by default', async () => {
      const result = await introspect(await client(), {
        includeDeprecated: false,
      })

      expect(result.__schema.types).toEqual(
        fullSchema.__schema.types.map((type) => {
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
