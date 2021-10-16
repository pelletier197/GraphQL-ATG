import { introspect } from '../../../../../src/lib/core/atg/introspection/introspecter';
import { createClient } from '../../../../../src/lib/infrastructure/graphql/client';
import { INTROSPECTION_SCHEMA, startFarmServer, } from '../../../__utils__/farm/server';
import { lazy } from '../../../__utils__/lazy';
const server = lazy(startFarmServer);
const client = lazy(async () => createClient((await server()).url));
afterAll(async () => {
    ;
    (await server()).manager.stop();
});
describe('running introspection query on a running server', () => {
    describe('and no config is provided', () => {
        it('should include deprecated fields by default', async () => {
            const result = await introspect(await client());
            expect(result).toEqual(INTROSPECTION_SCHEMA);
        });
    });
    describe('and config to ignore deprecated fields is provided', () => {
        it('should include deprecated fields by default', async () => {
            const result = await introspect(await client(), {
                includeDeprecated: false,
            });
            expect(result.__schema.types).toEqual(INTROSPECTION_SCHEMA.__schema.types.map((type) => {
                const fields = type.fields?.filter((field) => !field.isDeprecated) ?? null;
                return {
                    ...type,
                    fields,
                };
            }));
        });
    });
});
