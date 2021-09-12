import { Headers } from "@lib/infrastructure/graphql/client";

export type GraphQLAtgConfig = {
    readonly endpoint: string
    readonly headers?: Headers
}