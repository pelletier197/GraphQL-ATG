/* eslint-disable functional/immutable-data */
import { Listr } from 'listr2';
function taskAsContext(wrapper, config) {
    return {
        updateName: (newName) => {
            if (wrapper.errors.length === 0 || !config.exitOnError) {
                wrapper.title = newName;
            }
            return newName;
        },
    };
}
export function newTask(task, config) {
    const tasks = new Listr({
        title: config.name,
        task: async (context, wrapper) => {
            const result = await task(taskAsContext(wrapper, config));
            context.result = result;
        },
    }, {
        exitOnError: config.exitOnError,
        concurrent: false,
    });
    return {
        start: async () => (await tasks.run()).result,
    };
}
export function newMultiTask(subTasks, config) {
    const tasks = new Listr({
        title: config.name,
        task: (context, wrapper) => {
            context.results = [];
            return wrapper.newListr(subTasks.map((subTask) => {
                return {
                    title: 'Pending...',
                    task: async (subContext, subWrapper) => {
                        subWrapper.title = subTask.name;
                        const result = await subTask.run(taskAsContext(subWrapper, config));
                        subContext.results.push(result);
                    },
                };
            }), {
                concurrent: Math.max(config.concurrency, 1),
                exitOnError: config.exitOnError,
            });
        },
    }, {
        concurrent: false,
        exitOnError: config.exitOnError,
    });
    return {
        start: async () => {
            const context = await tasks.run();
            return {
                results: context.results,
                errors: tasks.err.map((err) => err.error),
            };
        },
    };
}
