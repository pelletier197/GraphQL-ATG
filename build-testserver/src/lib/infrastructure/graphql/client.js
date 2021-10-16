import { ClientError, GraphQLClient as NativeClient } from 'graphql-request';
export function createClient(endpoint, headers = {}) {
    const nativeClient = new NativeClient(endpoint);
    Object.entries(headers).forEach(([key, value]) => {
        nativeClient.setHeader(key, value);
    });
    return {
        request: async (query, variables) => {
            try {
                const { data } = await nativeClient.rawRequest(query, variables);
                return {
                    data: data,
                    errors: [],
                };
            }
            catch (error) {
                if (error instanceof ClientError) {
                    return {
                        data: error.response.data,
                        errors: error.response.errors || [],
                    };
                }
                throw error;
            }
        },
    };
}
