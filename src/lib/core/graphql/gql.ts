import compress from 'graphql-query-compress'
import { gql as implementation } from 'graphql-request'
import prettierGraphql from 'prettier/parser-graphql.js'
import prettier from 'prettier/standalone.js'

export default function (chunks: TemplateStringsArray): string {
  return implementation(chunks)
}

export function prettify(request: string): string {
  return prettier.format(request, {
    parser: 'graphql',
    plugins: [prettierGraphql],
    tabWidth: 2,
  })
}

export function minify(request: string): string {
  return compress(request)
}
