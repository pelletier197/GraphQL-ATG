export function lazy<T>(callback: () => Promise<T>): () => Promise<T> {
  // eslint-disable-next-line functional/no-let
  let value: T
  // eslint-disable-next-line functional/no-let
  let init: boolean

  // TODO - find a way to make this sync to avoid overhead
  return async () => {
    if (!init) {
      value = await callback()

      console.log(value)
      init = true
    }

    return value
  }
}
