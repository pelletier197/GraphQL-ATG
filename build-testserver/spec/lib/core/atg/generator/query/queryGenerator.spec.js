import { NullGenerationStrategy, } from '../../../../../../src/lib/core/atg/generator/config';
import { GraphQLIntrospectionResultError } from '../../../../../../src/lib/core/atg/generator/error';
import { generateGraphQLQueries } from '../../../../../../src/lib/core/atg/generator/query/queryGenerator';
import gql, { minify, prettify } from '../../../../../../src/lib/core/graphql/gql';
import { INTROSPECTION_SCHEMA } from '../../../../__utils__/farm/server';
const DEFAULT_CONFIG = {
    factories: {},
    maxDepth: 8,
    nullGenerationStrategy: NullGenerationStrategy.NEVER_NULL,
};
describe('generating graphql queries', () => {
    describe('introspection query has no root query type', () => {
        it('should generate no queries', async () => {
            const result = await generateGraphQLQueries({
                __schema: {
                    directives: [],
                    types: [],
                },
            }, DEFAULT_CONFIG);
            expect(result).toHaveLength(0);
        });
    });
    describe('introspection query max depth configuration is too low', () => {
        it('should generate no queries', async () => {
            const result = await generateGraphQLQueries(INTROSPECTION_SCHEMA, {
                ...DEFAULT_CONFIG,
                maxDepth: 2,
            });
            expect(result).toHaveLength(0);
        });
    });
    describe('introspection query max depth configuration has an acceptable depth for root fields', () => {
        it('should generate a query that goes up to the max depth', async () => {
            const result = await generateGraphQLQueries(INTROSPECTION_SCHEMA, {
                ...DEFAULT_CONFIG,
                maxDepth: 4,
            });
            assertGraphQLQueryEqual(result, [
                {
                    query: gql `
            query {
              farm {
                vegetables {
                  name
                  isBestVegetableOnEarth
                  cookingModes
                }
              }
            }
          `,
                    variables: {},
                },
            ]);
        });
    });
    describe('introspection query has a root query type, but the root type does not exist in the types list', () => {
        it('should generate no queries', () => {
            expect(generateGraphQLQueries({
                __schema: {
                    queryType: { name: 'Query' },
                    directives: [],
                    types: [],
                },
            }, DEFAULT_CONFIG)).rejects.toBeInstanceOf(GraphQLIntrospectionResultError);
        });
    });
    it('should run', async () => {
        const generatedQueries = await generateGraphQLQueries(INTROSPECTION_SCHEMA, DEFAULT_CONFIG);
        expect(generatedQueries).toHaveLength(1);
        expect(prettify(minify(generatedQueries[0].query))).toEqual(prettify(minify(gql `
          query ($names: String) {
            farm {
              animals {
                all(names: $names) {
                  name
                  sound
                  baby {
                    name
                    sound
                    baby {
                      name
                      sound
                      baby {
                        name
                        sound
                      }
                    }
                  }
                }

                herbivore {
                  name
                  sound
                  baby {
                    name
                    sound
                    baby {
                      name
                      sound
                      baby {
                        name
                        sound
                      }
                    }
                  }
                }

                carnivore {
                  name
                  sound
                  baby {
                    name
                    sound
                    baby {
                      name
                      sound
                      baby {
                        name
                        sound
                      }
                    }
                  }
                }

                eatable {
                  name
                  sound
                  baby {
                    name
                    sound
                    baby {
                      name
                      sound
                      baby {
                        name
                        sound
                      }
                    }
                  }
                }
              }

              vegetables {
                name
                isBestVegetableOnEarth
                cookingModes
              }

              employees {
                fullTime {
                  name
                  salary
                }

                interns {
                  name
                  salary
                }

                unpaidInterns {
                  name
                  salary
                }
              }
            }
          }
        `)));
        expect(Object.keys(generatedQueries[0].variables)).toHaveLength(1);
    });
});
function assertGraphQLQueryEqual(actual, expected) {
    function transform(array) {
        return array.map((initial) => ({
            ...initial,
            query: prettify(minify(initial.query)),
        }));
    }
    expect(transform(actual)).toEqual(transform(expected));
}
