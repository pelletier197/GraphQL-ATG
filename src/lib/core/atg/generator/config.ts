export type GeneratorConfig = {
  /**
   * The max depth at which we want to generate the query.
   *
   * If the query gets over that depth, all fields that are not leaves are discarded from the query.
   */
  readonly maxDepth: number
  /**
   * Custom factories. Custom factories are used when generating random input values to pass as arguments to your API.
   *
   * The supported syntax in order of priority for the factory key is the following:
   *  - '[Type]' : In highest priority is the list matcher. If you need to provide a custom list for a specific type.
   *               If you don't need anything specific in the list, you can use the second matcher.
   *
   *  - 'Type' : Your type directly. If there is a direct match for this key, it will be used first.
   *             This factory will also be used when generating a list if no list factory is provided.
   */
  readonly factories: Record<string, GraphQLFactory>
}

export type GraphQLFactoryContext = {
  readonly targetName: string
}
/**
 * A factory providing a random or arbitrary value for a given target argument or argument field.
 */
export type GraphQLFactory = (context: GraphQLFactoryContext) => unknown
