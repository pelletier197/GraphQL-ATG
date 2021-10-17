import type { IResolvers } from '@graphql-tools/utils'
import { ApolloServer } from 'apollo-server'
import { findFreePorts } from 'find-free-ports'

export type TestGraphQLServer = {
  readonly url: string

  readonly manager: ServerManager
}

type ServerManager = {
  readonly stop: () => Promise<void>
}

export async function startTestServer(
  schema: string,
  resolvers: IResolvers
): Promise<TestGraphQLServer> {
  const server = new ApolloServer({
    typeDefs: schema,
    resolvers: resolvers,
    
  })

  const started = await server.listen({
    port: (await findFreePorts(1))[0],
  })

  return {
    url: started.url,
    manager: {
      stop: async () => server.stop(),
    },
  }
}
