/* eslint-disable functional/immutable-data */

import { Listr, ListrDefaultRendererOptions, ListrRendererValue } from 'listr2'
import { TaskWrapper } from 'listr2/dist/lib/task-wrapper'

const RENDERER_OPTIONS: ListrDefaultRendererOptions<ListrRendererValue> = {
  rendererOptions: {
    formatOutput: 'wrap',
    collapse: false,
    clearOutput: false,
  },
}

function taskAsContext(
  wrapper: TaskWrapper<unknown, never>,
  config: TaskConfig
): TaskContext {
  function canUpdate() {
    return wrapper.errors.length === 0 || !config.exitOnError
  }

  return {
    logInfo: (info: string) => {
      if (canUpdate()) {
        wrapper.output = (wrapper.output || '') + info
      }
    },
    updateName: (newName: string) => {
      if (canUpdate()) {
        wrapper.title = newName
      }
    },
  }
}

export function newTask<T>(
  task: (context: TaskContext) => Promise<T>,
  config: TaskConfig
): Task<T> {
  const tasks = new Listr(
    {
      title: config.name,
      task: async (context, wrapper) => {
        const result = await task(taskAsContext(wrapper, config))

        context.result = result
      },
    },
    {
      exitOnError: config.exitOnError,
      concurrent: false,
      ...RENDERER_OPTIONS,
    }
  )

  return {
    start: async () => (await tasks.run()).result,
  }
}

export function newMultiTask<T>(
  subTasks: ReadonlyArray<SubTask<T>>,
  config: MultiTaskConfig
): Task<MultiTaskResult<T>> {
  const tasks = new Listr(
    {
      title: config.name,
      task: (context, wrapper) => {
        context.results = []

        return wrapper.newListr(
          subTasks.map((subTask: SubTask<T>) => {
            return {
              title: 'Pending...',
              task: async (subContext, subWrapper) => {
                subWrapper.title = subTask.name

                const result = await subTask.run(
                  taskAsContext(subWrapper, config)
                )

                subContext.results.push(result)
              },
            }
          }),
          {
            concurrent: Math.max(config.concurrency, 1),
            exitOnError: config.exitOnError,
          }
        )
      },
    },
    {
      concurrent: false,
      exitOnError: config.exitOnError,
      ...RENDERER_OPTIONS,
    }
  )

  return {
    start: async () => {
      const context = await tasks.run()
      return {
        results: context.results,
        errors: tasks.err.map((err) => err.error),
      }
    },
  }
}

// eslint-disable-next-line functional/no-mixed-type
export type SubTask<T> = {
  readonly name: string
  readonly run: (context: TaskContext) => Promise<T>
}

export type TaskConfig = {
  readonly name: string
  readonly exitOnError: boolean
}

export type MultiTaskConfig = TaskConfig & {
  readonly concurrency: number
}

export type MultiTaskResult<T> = {
  readonly results: ReadonlyArray<T>
  readonly errors: ReadonlyArray<Error>
}

export type TaskContext = {
  readonly logInfo: (info: string) => void
  readonly updateName: (newName: string) => void
}

export type Task<T> = {
  readonly start: () => Promise<T>
}
