import { ApolloServer } from 'apollo-server';
import findFreePorts from 'find-free-ports';
console.log(findFreePorts)
export async function startTestServer(schema, resolvers) {
    const server = new ApolloServer({
        typeDefs: schema,
        resolvers: resolvers,
    });
    const started = await server.listen({
        port: (await findFreePorts(1))[0],
    });
    return {
        url: started.url,
        manager: {
            stop: async () => server.stop(),
        },
    };
}
