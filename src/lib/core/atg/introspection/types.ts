export type GraphQLIntrospectionResult = {
  readonly __schema: {
    readonly queryType: {
      readonly name: string
    }
    readonly mutationType: {
      readonly name: string
    }
    readonly subscriptionType: {
      readonly name: string
    }
  }
}

export type FullType = {
  readonly kind: string
  readonly name: string
  readonly description: string
  readonly fields: {
    readonly name: string
    readonly description: string
    readonly args: ReadonlyArray<InputValue>
    readonly type: TypeRef
    readonly isDeprecated: boolean
    readonly deprecationReason: string
  }
  readonly inputFields: ReadonlyArray<InputValue>
  readonly interfaces: ReadonlyArray<TypeRef>
  readonly enumValues: {
    readonly name: string
    readonly description: string
    readonly isDeprecated: boolean
    readonly deprecationReason: string
  }
  readonly possibleTypes: ReadonlyArray<TypeRef>
}

export type InputValue = {
  readonly name: string
  readonly description: string
  readonly type: TypeRef
  readonly defaultValue: unknown
}

export type TypeRef = {
  readonly kind: string
  readonly name: string
  readonly ofType: TypeRef | null | undefined
}
