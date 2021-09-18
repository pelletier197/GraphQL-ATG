import { createClient } from '@lib/infrastructure/graphql/client'
import { startFarmServer } from '@test/__utils__/farmServer'
import { lazy } from '@test/__utils__/lazy'

const server = lazy(startFarmServer)
const client = lazy(async () => createClient((await server()).url))

afterAll(async () => {
  ;(await server()).manager.stop()
})

describe('running introspection query on a running server', () => {})
