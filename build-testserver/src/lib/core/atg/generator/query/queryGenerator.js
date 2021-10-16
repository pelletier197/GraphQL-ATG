import { queryBuilder, subSelectionBuilder, } from '../../../graphql/query/builder';
import { newTask } from '../../../progress/progressIndicator';
import _ from 'lodash';
import { NullGenerationStrategy } from '../config';
import { getRequiredType, isLeaf, unwrapFieldType } from './extractor';
import { generateArgsForField } from './fakeGenerator';
const DEFAULT_CONFIG = {
    maxDepth: 5,
    nullGenerationStrategy: NullGenerationStrategy.NEVER_NULL,
    factories: {},
};
export async function generateGraphQLQueries(introspectionResult, config) {
    const task = newTask(async () => {
        const mergedConfig = Object.assign({}, DEFAULT_CONFIG, config);
        const schema = introspectionResult.__schema;
        // There is no query type, so no queries can be generated
        if (!schema.queryType)
            return [];
        const typesByName = _.keyBy(schema.types, (type) => type.name);
        const rootQueryType = getRequiredType(schema.queryType.name, typesByName);
        if (!rootQueryType.fields)
            return [];
        const initialBuilder = queryBuilder();
        return rootQueryType.fields
            .map((field) => {
            return buildField(initialBuilder, field, typesByName, mergedConfig, 1);
        })
            .filter((x) => x !== initialBuilder)
            .map((x) => x.build());
    }, {
        exitOnError: true,
        name: 'Generate queries',
    });
    return await task.start();
}
function generateField(type, typesByName, config, depth) {
    // Go no further
    if (depth >= config.maxDepth) {
        return null;
    }
    if (isLeaf(type)) {
        // No more fields under
        return null;
    }
    const builder = subSelectionBuilder();
    const fields = type.fields || [];
    const finalBuilderWithAllFields = _.reduce(fields, (memo, field) => {
        return buildField(memo, field, typesByName, config, depth);
    }, builder);
    if (finalBuilderWithAllFields === builder) {
        // No change in the builder indicates that there were no leaf elements
        // and that no sub fields could be selected due to max depth being reached
        return null;
    }
    return finalBuilderWithAllFields;
}
function buildField(builder, field, typesByName, config, depth) {
    const parameters = generateArgsForField(field, typesByName, config);
    const type = unwrapFieldType(field, typesByName);
    const isLeafField = isLeaf(type);
    if (isLeafField) {
        // No sub selection is allowed since this is a leaf
        return builder.withField(field.name, parameters);
    }
    const generatedSubSelection = generateField(type, typesByName, config, depth + 1);
    if (generatedSubSelection === null) {
        // No new field in the builder, as we can't select any sub field due to max depth
        return builder;
    }
    // Modify the builder to select the sub field
    return builder.withField(field.name, parameters, generatedSubSelection);
}
