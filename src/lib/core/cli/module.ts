import { InvalidArgumentError } from 'commander'
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
  const genericError = `
        Invalid factories configuration. Ensure your default export is an object with strings as keys and functions as values.
        Example: 
          export default {
              'Paging': (context) => ({ first: 10, skip: 0 })
          }
      `.trimStart()

  try {
    const configuration = (await import(value)).default

    const result = Module.safeParse(configuration)
    console.log(result)
    if (!(configuration instanceof Object)) {
      const specificError = `Expected default export to be of type Object, but was ${configuration} of type ${typeof configuration}`
      throw new InvalidArgumentError(`${specificError}\n\n${genericError}`)
    }

    return configuration
  } catch (error) {
    if (error instanceof InvalidArgumentError) {
      throw error
    }

    throw new InvalidArgumentError(
      `Module could not be imported. Make sure it exists and that it is a valid javascript file: ${error}`
    )
  }
}
