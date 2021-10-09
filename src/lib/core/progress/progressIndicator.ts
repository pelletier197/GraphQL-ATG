/* eslint-disable functional/immutable-data */
import { Semaphore } from 'semaphore-async-await'

import { Listr } from 'listr2'
import ora from 'ora'

const spinner = ora({
  spinner: {
    frames: ['●—○—◯', '◯—●—◯', '◯—◯—●', '◯—●—◯'],
    interval: 250,
  },
  color: 'green',
})

export function start(text: string) {
  console.log() // Skip one line
  spinner.start(text)
}

export function info(text: string) {
  spinner.info(text)
}

export function succeed() {
  spinner.succeed()
}

export function failed(reason?: string) {
  if (reason) {
    spinner.fail(`${spinner.text}\n${reason}`)
  } else {
    spinner.fail(reason)
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
        const result = await task({
          updateName: (newName: string) => {
            wrapper.title = newName
            return newName
          },
        })

        context.result = result
      },
    },
    {
      exitOnError: config.exitOnError,
    }
  )

  return {
    start: async () => (await tasks.run()).result,
  }
}

export function newMultiTask<T>(
  subTasks: ReadonlyArray<SubTask<T>>,
  config: MultiTaskConfig
): Task<ReadonlyArray<T>> {
  const semaphore = new Semaphore(Math.max(config.concurrency, 1))

  const tasks = new Listr(
    {
      title: config.name,
      task: async (context, wrapper) => {
        context.results = []

        wrapper.newListr(
          subTasks.map((subTask: SubTask<T>) => {
            return {
              title: 'Pending...',
              task: async (subContext, subWrapper) => {
                await semaphore.acquire()

                subWrapper.title = subTask.name

                try {
                  const result = await subTask.run({
                    updateName: (newName: string) => {
                      subWrapper.title = newName
                      return newName
                    },
                  })

                  subContext.results.push(result)
                } finally {
                  semaphore.release()
                }
              },
            }
          })
        )
      },
    },
    {
      exitOnError: config.exitOnError,
      concurrent: true,
    }
  )

  return {
    start: async () => (await tasks.run()).results,
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

export type TaskContext = {
  readonly updateName: (newName: string) => string
}

export type Task<T> = {
  readonly start: () => Promise<T>
}
