import type { IResolvers } from '@graphql-tools/utils'
import { ApolloServer } from 'apollo-server'

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

  const started = await server.listen()
  return {
    url: started.url,
    manager: {
      stop: async () => server.stop(),
    },
  }
}
