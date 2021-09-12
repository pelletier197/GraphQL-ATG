import { GraphQLClient } from '@lib/core/graphql/client'
import { GraphQLIntrospectionResult } from './types'

export type IntrospectionConfig = {
    
}

export function introspect(client: GraphQLClient): Promise<GraphQLIntrospectionResult> {
    const result = client.request()
}
