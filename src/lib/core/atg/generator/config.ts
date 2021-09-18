export type GeneratorConfig = {
  readonly maxDepth: number
  readonly factories: Record<string, GraphQLFactory>
}

export type GraphQLFactory = () => Record<string, unknown>
