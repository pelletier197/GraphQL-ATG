import { GraphQLQueryError } from '../../graphql/error';
import { newTask } from '../../progress/progressIndicator';
import { INTROSPECTION_QUERY } from './query';
const DEFAULT_INTROSPECTION_CONFIG = {
    includeDeprecated: true,
};
export async function introspect(client, config) {
    const task = newTask(async () => {
        const result = await client.request(INTROSPECTION_QUERY, Object.assign({}, DEFAULT_INTROSPECTION_CONFIG, config));
        if (!result.data || result.errors?.length > 0) {
            throw new GraphQLQueryError('expected introspection result to contain data and no errors, but did not', result);
        }
        return result;
    }, {
        name: 'Introspection query',
        exitOnError: true,
    });
    const result = await task.start();
    if (result.data) {
        return result.data;
    }
    throw Error('this code should be unreachable code');
}
