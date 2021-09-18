import { format } from 'graphql-formatter'
import compress from 'graphql-query-compress'
import { gql as implementation } from 'graphql-request'

export default function (chunks: TemplateStringsArray): string {
  return implementation(chunks)
}

export function prettify(request: string): string {
  return format(request)
}

export function minify(request: string): string {
  return compress(request)
}
