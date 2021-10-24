import { GraphQLQuery } from '@lib/core/graphql/query/query.js'
import { TaskContext } from '@lib/core/task/task.js'

export type RunnerHook = {
  readonly beforeTest?: HookCallback
  readonly onSuccess?: HookCallback
  readonly onFail?: HookCallback
}

export type RunnerHookContext = {
  readonly query: GraphQLQuery
  readonly task: TaskContext
}

export type HookCallback = (context: RunnerHookContext) => Promise<void>
