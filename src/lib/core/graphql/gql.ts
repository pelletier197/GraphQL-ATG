import { gql as implementation } from 'graphql-request'

export default function (
  chunks: TemplateStringsArray,
  variables?: ReadonlyArray<unknown>
): string {
  if (variables) {
    return implementation(chunks)
  }

  return implementation(chunks, variables)
}
