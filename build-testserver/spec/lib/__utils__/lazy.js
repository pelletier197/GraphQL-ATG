export function lazy(callback) {
    // eslint-disable-next-line functional/no-let
    let value;
    // eslint-disable-next-line functional/no-let
    let init;
    return async () => {
        if (!init) {
            value = await callback();
            init = true;
        }
        return value;
    };
}
