import { Kind, } from '../../introspection/types';
import { GraphQLIntrospectionResultError } from '../error';
export function unwrapFieldType(field, typesByName) {
    return unwrapType(field.type, typesByName, field.name);
}
export function unwrapInputValueType(input, typesByName) {
    return unwrapType(input.type, typesByName, input.name);
}
export function unwrapNonNull(type) {
    if (isNonNull(type) && type.ofType) {
        return type.ofType;
    }
    return type;
}
export function unwrapList(type) {
    if (isList(type) && type.ofType) {
        return type.ofType;
    }
    return type;
}
export function unwrapType(type, typesByName, source) {
    if (!type.ofType) {
        const supportedLeaves = [
            Kind.INTERFACE,
            Kind.OBJECT,
            Kind.SCALAR,
            Kind.ENUM,
            Kind.INPUT_OBJECT,
            Kind.UNION,
        ];
        if (!supportedLeaves.includes(type.kind)) {
            throw createIntrospectionError(`
            Leaf element ${specifiedBySource(source)} has invalid kind ${type.kind} 
            Supported types for leaf elements include ${supportedLeaves}
        `);
        }
        if (!type.name) {
            throw createIntrospectionError(`
        Leaf element ${specifiedBySource(source)} has 'name' property set to null
      `);
        }
        return getRequiredType(type.name, typesByName, source);
    }
    return unwrapType(type.ofType, typesByName, source);
}
export function isList(type) {
    if (type.kind == Kind.LIST) {
        return true;
    }
    return false;
}
export function isNonNull(type) {
    return type.kind == Kind.NON_NULL;
}
export function typeToString(type) {
    function unwrapOneNotNull(type) {
        if (!type.ofType) {
            throw createIntrospectionError(`
        Unexpected leaf element '${type.kind}'
      `);
        }
        return type.ofType;
    }
    switch (type.kind) {
        case Kind.OBJECT:
        case Kind.INTERFACE:
        case Kind.SCALAR:
        case Kind.ENUM:
        case Kind.INPUT_OBJECT:
            if (!type.name) {
                throw createIntrospectionError(`
            Type of kind '${type.kind}' has invalid name '${type.name}' 
          `);
            }
            return type.name;
        case Kind.NON_NULL:
            return `${typeToString(unwrapOneNotNull(type))}!`;
        case Kind.LIST:
            return `[${typeToString(unwrapOneNotNull(type))}]`;
        default:
            throw new Error(`this should be unreachable but was reached with type ${type.kind}`);
    }
}
export function getRequiredType(typeName, typesByName, source) {
    const rootQueryType = typesByName[typeName];
    if (rootQueryType == null) {
        throw createIntrospectionError(`Type '${typeName}'${specifiedBySource(source)} is not present in the list of types returned by the introspection query.`);
    }
    return rootQueryType;
}
function specifiedBySource(source) {
    return source ? ` specified by '${source}'` : '';
}
export function createIntrospectionError(message) {
    return new GraphQLIntrospectionResultError(`
        ${message}
        ${thisIsNotSupposedToHappen()}
      `.trimStart());
}
function thisIsNotSupposedToHappen() {
    return `
        This is not supposed to happen in any valid GraphQL server implementation...
    `;
}
export function isLeaf(type) {
    return !type.fields || type.fields.length === 0;
}
