import compress from 'graphql-query-compress';
import { gql as implementation } from 'graphql-request';
import prettierGraphql from 'prettier/parser-graphql';
import prettier from 'prettier/standalone';
export default function (chunks) {
    return implementation(chunks);
}
export function prettify(request) {
    return prettier.format(request, {
        parser: 'graphql',
        plugins: [prettierGraphql],
        tabWidth: 2,
    });
}
export function minify(request) {
    return compress(request);
}
