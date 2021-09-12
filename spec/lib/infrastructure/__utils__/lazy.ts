export function lazy<T>(callback: () => Promise<T>): () => Promise<T> {
  // eslint-disable-next-line functional/no-let
  let value: T
  // eslint-disable-next-line functional/no-let
  let init: boolean

  return async () => {
    if (!init) {
      value = await callback()

      init = true
    }

    return value
  }
}
