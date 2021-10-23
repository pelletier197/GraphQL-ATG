import { GraphQLClient, GraphQLVariables } from '@lib/core/graphql/client.js'
import { ClientError, GraphQLClient as NativeClient } from 'graphql-request'

export type Headers = {
  readonly [name: string]: string
}

export function createClient(
  endpoint: string,
  headers: Headers = {}
): GraphQLClient {
  const nativeClient = new NativeClient(endpoint)

  Object.entries(headers).forEach(([key, value]) => {
    nativeClient.setHeader(key, value)
  })

  return {
    request: async (query: string, variables?: GraphQLVariables) => {
      try {
        const { data } = await nativeClient.rawRequest(query, variables)
        return {
          data: data,
          errors: [],
        }
      } catch (error) {
        if (error instanceof ClientError) {
          return {
            data: error.response.data,
            errors: error.response.errors || [],
          }
        }

        throw error
      }
    },
  }
}
