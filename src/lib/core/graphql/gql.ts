import { gql as implementation } from 'graphql-request'

export default function (chunks: TemplateStringsArray): string {
  return implementation(chunks)
}
