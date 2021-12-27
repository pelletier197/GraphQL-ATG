import { InvalidArgumentError } from 'commander'
import _ from 'lodash'
import { z } from 'zod'

import { GraphQLFactory } from '../atg/generator/config.js'
import { RunnerHook } from '../atg/runner/hooks/hook.js'

export type ExtensionModule = {
  readonly factories: Record<string, GraphQLFactory>
  readonly hooks: ReadonlyArray<RunnerHook>
}

const Module = z.object({
  factories: z.record(z.string(), z.function()),
  hooks: z.array(
    z.object({
      beforeTest: z.optional(z.function()),
      onSuccess: z.optional(z.function()),
      onFail: z.optional(z.function()),
    })
  ),
})

export async function parseModules(
  modules: ReadonlyArray<string>
): Promise<ExtensionModule> {
  return await modules.reduce(
    async (previous: Promise<ExtensionModule>, current: string) => {
      const previousValue = await previous
      const result = await parseModule(current)
      return {
        factories: {
          ...previousValue.factories,
          ...result.factories,
        },
        hooks: [...previousValue.hooks, ...result.hooks],
      }
    },
    Promise.resolve({ factories: {}, hooks: [] })
  )
}

async function parseModule(value: string): Promise<ExtensionModule> {
  try {
    const configuration = (await import(value)).default

    const result = Module.safeParse(configuration)

    if (result.success) {
      return result.data as ExtensionModule
    }

    const message = formatMessage(result.error, value)
    throw new InvalidArgumentError(message)
  } catch (error) {
    if (error instanceof InvalidArgumentError) {
      throw error
    }

    throw new InvalidArgumentError(
      `Module could not be imported. Make sure it exists and that it is a valid javascript file: ${error}`
    )
  }
}

function formatPath(path: ReadonlyArray<string | number>): string {
  return _.reduce(
    path,
    (accumulator: string, current: string | number) => {
      if (typeof current === 'number') {
        return accumulator + `[${current}]`
      }

      if (
        accumulator.length === 0 ||
        accumulator[accumulator.length - 1] === ']'
      ) {
        return accumulator + current
      }

      return accumulator + `.${current}`
    },
    ''
  )
}

function formatMessage(error: z.ZodError<unknown>, modulePath: string): string {
  const messages = error.issues.map(
    (issue) => `${issue.message} at path ${formatPath(issue.path)}`
  )
  const formattedErrors = messages.map((m) => `\t - ${m}`).join('\n')
  return `${messages.length} errors were found with the module at path ${modulePath}:\n${formattedErrors}`
}
