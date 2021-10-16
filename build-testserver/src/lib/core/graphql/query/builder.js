/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
import _ from 'lodash';
export var QueryType;
(function (QueryType) {
    QueryType["QUERY"] = "query";
    QueryType["MUTATION"] = "mutation";
})(QueryType || (QueryType = {}));
export class QueryBuilder {
    constructor(type, name, fields) {
        this.fields = {};
        this.name = '';
        this.type = type;
        this.name = name;
        this.fields = fields;
    }
    withType(type) {
        return new QueryBuilder(type, this.name, this.fields);
    }
    withName(name) {
        return new QueryBuilder(this.type, name, this.fields);
    }
    withField(name, parameters, subSelection) {
        name = name.trim();
        return new QueryBuilder(this.type, this.name, {
            ...this.fields,
            [name]: {
                parameters: parameters,
                subSelection,
            },
        });
    }
    build() {
        const subSelection = this.buildSelection(new Set());
        const variablePlaceholder = this.generateArgumentPlaceholder(subSelection.variables);
        return {
            query: `${this.type} ${this.name}${variablePlaceholder}${subSelection.query}`,
            variables: _.mapValues(_.keyBy(subSelection.variables, (variable) => variable.name), (variable) => variable.value),
        };
    }
    buildSelection(usedParameterNames) {
        if (!this.hasFields()) {
            throw new Error('Cannot generate a sub-selection with no fields in it. A minimum of one field must be queried if the sub-selection is defined.');
        }
        const mappedFields = _.mapValues(this.fields, (field) => ({
            parameters: field.parameters.map((parameter) => {
                return this.asUniquelyNamedParameter(parameter, usedParameterNames);
            }),
            subSelection: field.subSelection?.buildSelection(usedParameterNames),
        }));
        const fieldsAsQueries = Object.keys(mappedFields).map((name) => {
            const value = mappedFields[name];
            const parametersString = value.parameters
                .map((parameter) => `${parameter.name}: $${parameter.variableName}`)
                .join(', ');
            const parameterPlaceholder = parametersString.length === 0 ? '' : `(${parametersString})`;
            // format: field(arg: $arg, <parameterPlaceholder>) { <subSelection> }
            return `${name}${parameterPlaceholder}${value.subSelection?.query ?? ''}`;
        });
        const allQueryVariablesRequiredNested = _.flatMap(Object.keys(mappedFields).map((name) => {
            const mappedField = mappedFields[name];
            return [
                ...mappedField.parameters,
                ...(mappedField.subSelection?.variables || []), // Parameters of sub selection
            ];
        }));
        return {
            query: `
        {
          ${fieldsAsQueries.join('\n')}
        }
      `,
            variables: allQueryVariablesRequiredNested,
        };
    }
    generateArgumentPlaceholder(variables) {
        const variablesString = variables
            .map((variable) => `$${variable.variableName}:${variable.type}`)
            .join(', ');
        return variablesString.length === 0 ? '' : `(${variablesString})`;
    }
    asUniquelyNamedParameter(parameter, allUsedVariableNames, count = 1) {
        const current = count === 1 ? parameter.name : parameter.name + count;
        if (!allUsedVariableNames.has(current)) {
            allUsedVariableNames.add(current);
            return {
                variableName: current,
                ...parameter,
            };
        }
        return this.asUniquelyNamedParameter(parameter, allUsedVariableNames, count + 1);
    }
    hasFields() {
        return _.size(this.fields) !== 0;
    }
}
export function queryBuilder() {
    return new QueryBuilder(QueryType.QUERY, '', {});
}
export function mutationBuilder() {
    return new QueryBuilder(QueryType.MUTATION, '', {});
}
export function subSelectionBuilder() {
    return queryBuilder();
}
